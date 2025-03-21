const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true, unique: true },
  department: { type: String, required: true },    // New field for department
  courseLevel: { type: String, required: true },     // New field for course level (e.g., "100", "200", etc.)
  description: { type: String },
  capacity: { type: Number },
  prerequisites: [{ type: String }],
  days: [{ type: String }],  // An array of days (e.g., ["Monday", "Wednesday"])
  startTime: { type: String },
  endTime: { type: String },
  registeredStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }]
});

module.exports = mongoose.model('Course', CourseSchema);
