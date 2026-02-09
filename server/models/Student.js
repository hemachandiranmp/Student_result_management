const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  batch: { type: String, required: true },
  password: { type: String, required: true },
  displayPassword: { type: String } // Plain text password for admin visibility
});

module.exports = mongoose.model('Student', StudentSchema);
