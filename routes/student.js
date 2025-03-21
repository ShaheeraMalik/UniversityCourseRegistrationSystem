const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const Student = require('../models/student');


// GET: Student Dashboard (example)
router.get('/studentDashboard', async (req, res) => {
  try {
    const studentId = req.session.userId;
    if (!studentId) {
      return res.redirect('/auth/login');
    }
    const student = await Student.findById(studentId).populate('registeredCourses');
    const courses = await Course.find({});
    res.render('student/studentDashboard', { student, courses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ADD THIS: GET route for /student/register/:courseId
router.get('/register/:courseId', async (req, res) => {
    try {
      const studentId = req.session.userId;
      if (!studentId) {
        return res.status(401).send("You must be logged in as a student.");
      }
  
      const courseId = req.params.courseId;
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).send("Student not found");
      }
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send("Course not found");
      }
  
      // 1) Check if the student already COMPLETED the course
      if (student.completedCourses.includes(course.courseName)) {
        return res.status(400).send("You have already completed this course.");
      }
  
      // 2) Check if already registered
      if (student.registeredCourses.includes(course._id)) {
        return res.status(400).send("Already registered for this course.");
      }
  
      // 3) Register the course
      student.registeredCourses.push(course._id);
      await student.save();
  
      // 4) Optionally add the student to course's registeredStudents
      if (!course.registeredStudents.includes(student._id)) {
        course.registeredStudents.push(student._id);
        await course.save();
      }
  
      // 5) Return JSON success
      return res.status(200).json({
        success: true,
        courseName: course.courseName,
        courseCode: course.courseCode,
        days: course.days,
        startTime: course.startTime,
        endTime: course.endTime
      });
    } catch (err) {
      console.error("Error registering course:", err);
      res.status(500).send("Server error");
    }
});
  


router.get('/seatAvailability', async (req, res) => {
    try {
      const courses = await Course.find({});
      const seatData = courses.map(course => ({
        courseId: course._id.toString(),
        availableSeats: course.capacity - (course.registeredStudents ? course.registeredStudents.length : 0)
      }));
      res.json(seatData);
    } catch (err) {
      res.status(500).send("Error fetching seat availability");
    }
  });

  router.get('/mySchedule', async (req, res) => {
    try {
      const studentId = req.session.userId; // or however you identify the student
      if (!studentId) {
        return res.status(401).send("Not logged in as a student.");
      }
  
      // Find the student, populate the 'registeredCourses'
      const student = await Student.findById(studentId).populate('registeredCourses');
      if (!student) {
        return res.status(404).send("Student not found");
      }
  
      // Build a simplified schedule array if needed, or just return the courses as-is
      const schedule = student.registeredCourses.map(course => ({
        courseName: course.courseName,
        courseCode: course.courseCode,
        days: course.days,              // e.g. ["Monday","Thursday"]
        startTime: course.startTime,    // e.g. "08:00"
        endTime: course.endTime,        // e.g. "10:00"
      }));
  
      // Return the schedule in JSON
      res.json(schedule);
    } catch (err) {
      console.error("Error loading schedule:", err);
      res.status(500).send("Server error");
    }
  });
  

  module.exports = router;
  