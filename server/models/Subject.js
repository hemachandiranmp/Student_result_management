const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  subjectNames: [{ type: String, required: true }] // Array of subject names
});

// Unique index to prevent duplicate subject maps for same dept/sem
SubjectSchema.index({ department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
