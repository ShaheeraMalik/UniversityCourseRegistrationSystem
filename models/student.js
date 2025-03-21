const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registeredCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: String }]  // Optional field for report 3
});

module.exports = mongoose.model('Student', StudentSchema);
