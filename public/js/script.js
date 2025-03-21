/*************************************************************
 * script.js
 * Combined schedule rendering, seat updates, filtering, etc.
 *************************************************************/

// Maintain schedule state in sessionStorage
const scheduleKey = 'studentSchedule';
let studentSchedule = JSON.parse(sessionStorage.getItem(scheduleKey)) || [];

/*************************************************************
 * RENDER THE WEEKLY SCHEDULE
 *************************************************************/
function renderCalendar() {
  const calendarDiv = document.getElementById('calendar');
  if (!calendarDiv) return; // safety check if #calendar doesn't exist

  // Clear old content
  calendarDiv.innerHTML = '';

  // Helper to normalize times like "08:00:00" -> "08:00"
  function normalizeTime(timeString) {
    if (!timeString) return "";
    const parts = timeString.split(":");
    return parts.slice(0, 2).join(":"); // e.g. "08:00"
  }

  // Define days
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Build hour-long intervals from 08:00 to 14:00-15:00
  // If you want to end at 15:00, the last interval is 14:00-15:00
  const intervals = [];
  for (let hour = 8; hour < 15; hour++) {
    const startHour = hour.toString().padStart(2, "0");
    const endHour = (hour + 1).toString().padStart(2, "0");
    const start = `${startHour}:00`; 
    const end = `${endHour}:00`;     
    intervals.push({
      label: `${start}-${end}`, 
      start: start,
      end: end
    });
  }

  // Reload schedule from sessionStorage (in case it changed)
  studentSchedule = JSON.parse(sessionStorage.getItem(scheduleKey)) || [];

  // Start building the HTML table
  let html = "<table><thead><tr><th>Time</th>";
  days.forEach(day => {
    html += `<th>${day}</th>`;
  });
  html += "</tr></thead><tbody>";

  intervals.forEach(interval => {
    html += `<tr><td>${interval.label}</td>`;
    days.forEach(day => {
      // Look for a course matching this day, startTime, and endTime
      const course = studentSchedule.find(c => {
        const cStart = normalizeTime(c.startTime);
        const cEnd = normalizeTime(c.endTime);
        return c.day === day && cStart === interval.start && cEnd === interval.end;
      });
      if (course) {
        // We color it to indicate it's a registered course
        html += `<td style="background-color:#d1ffd1;">
                   ${course.courseName} (${course.startTime}-${course.endTime})
                 </td>`;
      } else {
        // "Available" slot
        html += `<td></td>`;
      }
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  calendarDiv.innerHTML = html;
}

/*************************************************************
 * REAL-TIME SEAT AVAILABILITY
 *************************************************************/
async function updateSeatAvailability() {
  try {
    const res = await fetch('/student/seatAvailability');
    if (res.ok) {
      const seatData = await res.json();
      seatData.forEach(item => {
        const el = document.querySelector(`.seat-count[data-course-id="${item.courseId}"]`);
        if (el) {
          el.textContent = item.availableSeats;
        }
      });
    }
  } catch (err) {
    console.error("Error updating seat availability:", err);
  }
}
setInterval(updateSeatAvailability, 10000); // poll every 10s

/*************************************************************
 * FILTERING SYSTEM
 *************************************************************/
function applyFilters() {
  // Convert department input to lowercase for "includes" matching
  const dept = document.getElementById('department').value.trim().toLowerCase();
  // Convert courseLevel input to a string (no need toLowerCase unless you store levels as strings)
  const level = document.getElementById('courseLevel').value.trim();
  const timeOfDay = document.getElementById('timeOfDay').value;

  const rows = document.querySelectorAll('#coursesTable tbody tr');
  rows.forEach(row => {
    let show = true;

    // Filter by department if user typed something
    if (dept) {
      const courseDept = (row.getAttribute('data-department') || '').toLowerCase();
      if (!courseDept.includes(dept)) show = false;
    }

    // Filter by course level if user typed something
    if (level) {
      const courseLevel = row.getAttribute('data-level') || '';
      if (courseLevel !== level) show = false;
    }

    // Filter by time of day (unchanged)
    if (timeOfDay) {
      const startTime = row.getAttribute('data-start') || '';
      const hour = parseInt(startTime.split(':')[0], 10);
      if (timeOfDay === 'morning' && (hour < 8 || hour >= 12)) show = false;
      if (timeOfDay === 'afternoon' && (hour < 12 || hour >= 15)) show = false;
    }

    row.style.display = show ? '' : 'none';
  });
  const availableSection = document.getElementById('availableCourses');
  if (availableSection) {
    availableSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/*************************************************************
 * REGISTER A COURSE
 *************************************************************/
async function registerCourse(courseId) {
  try {
    const res = await fetch(`/student/register/${courseId}`, { method: 'GET' });
    if (!res.ok) {
      const msg = await res.text();
      alert(msg);
      return;
    }
    const updatedCourse = await res.json();
    alert(`Successfully registered for course: ${updatedCourse.courseName}`);

    // Retrieve existing schedule
    let studentSchedule = JSON.parse(sessionStorage.getItem(scheduleKey)) || [];

    // Check if course is already in schedule
    const alreadyInSchedule = studentSchedule.some(
      c => c.courseCode === updatedCourse.courseCode
    );

    if (!alreadyInSchedule) {
      // For each day in updatedCourse.days, add a separate entry
      if (Array.isArray(updatedCourse.days) && updatedCourse.days.length > 0) {
        updatedCourse.days.forEach(day => {
          studentSchedule.push({
            day: day,
            startTime: updatedCourse.startTime,
            endTime: updatedCourse.endTime,
            courseName: updatedCourse.courseName,
            courseCode: updatedCourse.courseCode
          });
        });
      }
      sessionStorage.setItem(scheduleKey, JSON.stringify(studentSchedule));
      renderCalendar();
    }

    // Update seat availability
    updateSeatAvailability();

  } catch (error) {
    console.error(error);
    alert("Error registering course.");
  }
}

/*************************************************************
 * LOAD OFFICIAL SCHEDULE
 *************************************************************/
async function loadOfficialSchedule() {
  try {
    const res = await fetch('/student/mySchedule');
    if (!res.ok) {
      console.error("Error fetching official schedule:", await res.text());
      return;
    }
    const officialCourses = await res.json();

    const newSchedule = [];
    officialCourses.forEach(course => {
      // For each day in the course, create a separate entry
      if (Array.isArray(course.days)) {
        course.days.forEach(day => {
          newSchedule.push({
            day: day,
            startTime: course.startTime,
            endTime: course.endTime,
            courseName: course.courseName,
            courseCode: course.courseCode
          });
        });
      }
    });

    sessionStorage.setItem(scheduleKey, JSON.stringify(newSchedule));
    renderCalendar();
  } catch (error) {
    console.error("Error loading official schedule:", error);
  }
}

// On page load, load the official schedule from the server, then render the calendar
window.addEventListener('DOMContentLoaded', () => {
  loadOfficialSchedule();
  // Optionally also call updateSeatAvailability() once at start
  updateSeatAvailability();
});
