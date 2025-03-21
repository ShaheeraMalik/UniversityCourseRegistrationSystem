// routes/admin.js

const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const Student = require('../models/student');

// =============================
// 1) ADD A NEW COURSE
// =============================
router.post('/course/add', async (req, res) => {
  try {
    const {
      courseName,
      courseCode,
      department,
      courseLevel,
      description,
      capacity,
      prerequisites,
      days,
      startTime,
      endTime
    } = req.body;

    // Convert prerequisites from a comma-separated string to an array.
    // If user typed "None" or left it blank, store an empty array.
    let prereqArray = [];
    if (prerequisites) {
      const lower = prerequisites.trim().toLowerCase();
      if (!lower || lower === 'none') {
        prereqArray = [];
      } else {
        prereqArray = prerequisites
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);
      }
    }

    // Ensure 'days' is an array.
    const daysArray = Array.isArray(days) ? days : (days ? [days] : []);

    // Check for day/time conflicts:
    // For each selected day, look for an existing course with the same day, startTime, and endTime.
    for (const d of daysArray) {
      const conflict = await Course.findOne({
        days: d,
        startTime,
        endTime
      });
      if (conflict) {
        // Conflict found: re-fetch the dashboard data and re-render with an error message.
        const coursesData = await Course.find({});
        const studentsData = await Student.find({}).populate('registeredCourses');

        return res.render('admin/admindashboard', {
          courses: coursesData,
          students: studentsData,
          conflictError: `Conflict: Another course (${conflict.courseName}) is on ${d} from ${conflict.startTime} to ${conflict.endTime}.`,
          formData: {
            courseName,
            courseCode,
            department,
            courseLevel,
            description,
            capacity,
            prerequisites,
            days: daysArray,
            startTime,
            endTime
          }
        });
      }
    }

    // No conflicts found, proceed to create the new course.
    const newCourse = new Course({
      courseName,
      courseCode,
      department,
      courseLevel,
      description,
      capacity,
      prerequisites: prereqArray,
      days: daysArray,
      startTime,
      endTime
    });

    await newCourse.save();
    res.redirect('/admin/admindashboard');
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).send('Server Error');
  }
});

    
    // =============================
    // 2) UPDATE COURSE SEATS
    // =============================
router.post('/course/seats', async (req, res) => {
  const { courseId, newCapacity } = req.body;
  try {
    // Find the course by its courseCode (e.g. "1001")
    const course = await Course.findOne({ courseCode: courseId });
    if (!course) {
      return res.status(404).send('Course not found');
    }
    course.capacity = newCapacity;
    await course.save();
    res.redirect('/admin/admindashboard');
  } catch (error) {
    console.error('Error updating seats:', error);
    res.status(500).send('Server Error');
  }
});

// =============================
// 3) OVERRIDE REGISTRATION
// =============================
router.get('/student/override/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send('Student not found');
    }
    // Render override form
    res.render('admin/overrideStudentRegistration', { student });
  } catch (err) {
    console.error("Error loading override form:", err);
    res.status(500).send("Server Error");
  }
});

router.post('/student/override/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { courseCode } = req.body;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send("Student not found");
    }
    const course = await Course.findOne({ courseCode });
    if (!course) {
      return res.status(404).send("Course not found");
    }

    // Check if already registered
    if (student.registeredCourses.includes(course._id)) {
      return res.status(400).send("Student already registered for this course");
    }

    student.registeredCourses.push(course._id);
    await student.save();

    if (!course.registeredStudents.includes(student._id)) {
      course.registeredStudents.push(student._id);
      await course.save();
    }
    res.redirect('/admin/admindashboard');
  } catch (err) {
    console.error("Error overriding registration:", err);
    res.status(500).send("Server error");
  }
});

// =============================
// 4) REMOVE A STUDENT FROM A COURSE
// =============================
router.get('/student/removeCourse/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { courseId } = req.query;
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send("Student not found");

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    // Remove the course from student's registeredCourses
    student.registeredCourses = student.registeredCourses.filter(
      c => c.toString() !== course._id.toString()
    );
    await student.save();

    // Also remove the student from course's registeredStudents
    course.registeredStudents = course.registeredStudents.filter(
      s => s.toString() !== student._id.toString()
    );
    await course.save();

    res.redirect('/admin/admindashboard');
  } catch (err) {
    console.error("Error removing course from student:", err);
    res.status(500).send("Server error");
  }
});

// =============================
// 5) MARK A COURSE AS COMPLETED
// =============================
router.get('/student/markCompleted/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send("Student not found");
    }
    res.render('admin/markCourseCompleted', { student });
  } catch (err) {
    console.error("Error showing 'mark completed' form:", err);
    res.status(500).send("Server Error");
  }
});


router.post('/student/markCompleted/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const { courseCode } = req.body;
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).send("Student not found");
      }
  
      const course = await Course.findOne({ courseCode });
      if (!course) {
        return res.status(404).send(`No course found with code: ${courseCode}`);
      }
  
      // 1) Add the course name to completedCourses (if not already present)
      if (course.courseName && !student.completedCourses.includes(course.courseName)) {
        student.completedCourses.push(course.courseName);
      }
  
      // 2) Remove the course from the student's registeredCourses
      student.registeredCourses = student.registeredCourses.filter(
        c => c.toString() !== course._id.toString()
      );
  
      await student.save();
  
      // 3) Also remove the student from the course's registeredStudents array
      course.registeredStudents = course.registeredStudents.filter(
        s => s.toString() !== student._id.toString()
      );
      await course.save();
  
      // Redirect back to admin dashboard
      res.redirect('/admin/admindashboard');
    } catch (err) {
      console.error("Error marking course as completed:", err);
      res.status(500).send("Server error");
    }
  });
  

// =============================
// 6) REMOVE A COURSE FROM completedCourses
// =============================
router.get('/student/removeCompleted/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { courseName } = req.query;
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send("Student not found");

    student.completedCourses = student.completedCourses.filter(
      c => c !== courseName
    );
    await student.save();

    res.redirect('/admin/admindashboard');
  } catch (err) {
    console.error("Error removing completed course:", err);
    res.status(500).send("Server error");
  }
});

// =============================
// 7) REPORT ROUTES
// =============================
router.get('/reports/course-students', async (req, res) => {
  const { courseId } = req.query;
  try {
    const course = await Course.findOne({ courseCode: courseId }).populate('registeredStudents');
    if (!course) {
      return res.status(404).send('Course not found');
    }
    res.render('admin/reportCourseStudents', { course, students: course.registeredStudents });
  } catch (err) {
    console.error('Error generating course students report:', err);
    res.status(500).send('Server error');
  }
});

router.get('/reports/courses-available', async (req, res) => {
  try {
    const courses = await Course.find({
      $expr: { $lt: [ { $size: "$registeredStudents" }, "$capacity" ] }
    });
    res.render('admin/reportCoursesAvailable', { courses });
  } catch (err) {
    console.error('Error generating available courses report:', err);
    res.status(500).send('Server error');
  }
});

router.get('/reports/incomplete-prerequisites', async (req, res) => {
    try {
      const students = await Student.find({}).populate('registeredCourses');
      const incompleteStudents = [];
  
      students.forEach(student => {
        // The student's completed courses (array of strings)
        const completed = student.completedCourses || [];
  
        // We'll collect any registered courses that have unmet prerequisites
        let incompleteCourses = [];
  
        // Go through each course the student is registered for
        student.registeredCourses.forEach(course => {
          // Skip if the course has no prerequisites at all
          if (!course.prerequisites || course.prerequisites.length === 0) {
            return; // do nothing
          }
  
          // Check which prerequisites the student has NOT completed
          const unmet = course.prerequisites.filter(prereq => !completed.includes(prereq));
  
          // If the student hasn't completed all prerequisites, add the course name
          if (unmet.length > 0) {
            incompleteCourses.push(course.courseName);
          }
        });
  
        // If the student has at least one course with unmet prerequisites, track them
        if (incompleteCourses.length > 0) {
          // Build a plain object so we can store "incompleteCourses"
          // without mutating the Mongoose doc
          const studentObj = {
            _id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
            // store the list of courses that are missing prerequisites
            incompleteCourses
          };
          incompleteStudents.push(studentObj);
        }
      });
  
      // Render EJS, passing only the students who have incomplete courses
      res.render('admin/reportIncompletePrerequisites', { students: incompleteStudents });
    } catch (err) {
      console.error('Error generating incomplete prerequisites report:', err);
      res.status(500).send('Server error');
    }
  });
  

// =============================
// 8) ADMIN DASHBOARD ROUTE
// =============================
router.get('/admindashboard', async (req, res) => {
  try {
    const coursesData = await Course.find({});
    const studentsData = await Student.find({}).populate('registeredCourses');
    res.render('admin/admindashboard', {
      courses: coursesData,
      students: studentsData
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).send('Server Error');
  }
});

// =============================
// 9) UPDATE COURSE
// =============================

// GET: Show the Update Form
router.get('/course/update/:courseCode', async (req, res) => {
    const { courseCode } = req.params;
    const course = await Course.findOne({ courseCode }); // uses courseCode
    if (!course) return res.status(404).send('Course not found');
    res.render('admin/updateCourse', { course });
  });

  router.post('/course/update/:courseCode', async (req, res) => {
    const { courseCode } = req.params;
    const {
      courseName,
      newCourseCode, // if you allow changing the code
      description,
      capacity,
      prerequisites,
      days,
      startTime,
      endTime
    } = req.body;
  
    try {
      // Convert prerequisites
      let prereqArray = [];
      if (prerequisites) {
        const lower = prerequisites.trim().toLowerCase();
        if (!lower || lower === 'none') {
          prereqArray = [];
        } else {
          prereqArray = prerequisites
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);
        }
      }
  
      // Ensure days is an array
      const daysArray = Array.isArray(days) ? days : (days ? [days] : []);
  
      // 1) Check for day/time conflicts (excluding the current course itself)
      for (const d of daysArray) {
        const conflict = await Course.findOne({
          days: d,
          startTime,
          endTime,
          courseCode: { $ne: courseCode } // exclude this course from conflict check
        });
        if (conflict) {
          // Conflict found: re-render the form with an error message and the data
          return res.render('admin/updateCourse', {
            conflictError: `Conflict: Another course (${conflict.courseName}) already exists on ${d} from ${conflict.startTime} to ${conflict.endTime}.`,
  
            // We'll store the new form values so the admin doesn't lose them
            formData: {
              courseName,
              newCourseCode,
              description,
              capacity,
              prerequisites,
              days: daysArray,
              startTime,
              endTime
            }
          });
        }
      }
  
      // 2) Proceed with the update if no conflict
      const updatedCourse = await Course.findOneAndUpdate(
        { courseCode },
        {
          courseName,
          courseCode: newCourseCode || courseCode,
          description,
          capacity,
          prerequisites: prereqArray,
          days: daysArray,
          startTime,
          endTime
        },
        { new: true }
      );
  
      if (!updatedCourse) {
        return res.status(404).send('Course not found');
      }
  
      res.redirect('/admin/admindashboard');
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).send('Server Error');
    }
  });
  
  
  
/// =============================
// 10) DELETE COURSE
// =============================
router.get('/course/delete/:courseCode', async (req, res) => {
  try {
    // 1) Extract courseCode from the URL
    const { courseCode } = req.params;

    // 2) Find the course by courseCode
    const course = await Course.findOne({ courseCode });
    if (!course) {
      // If no course is found, just redirect or handle
      return res.redirect('/admin/admindashboard');
    }

    // 3) Remove references from all students' registeredCourses
    await Student.updateMany(
      { registeredCourses: course._id },
      { $pull: { registeredCourses: course._id } }
    );

    // (Optional) Remove from completedCourses by name if you want:
    await Student.updateMany(
      { completedCourses: course.courseName },
      { $pull: { completedCourses: course.courseName } }
    );

    // 4) Now physically delete the course from the database
    await Course.findOneAndDelete({ courseCode });

    // 5) Redirect back to the admin dashboard
    res.redirect('/admin/admindashboard');
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).send("Server error");
  }
});
  

module.exports = router;
