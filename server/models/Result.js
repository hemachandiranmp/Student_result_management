const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: Number, required: true, default: 1 },
  department: { type: String, required: true }, // For batch processing
  batch: { type: String, required: true },      // For batch processing
  subjects: [
    {
      subjectName: { type: String, required: true },
      marks: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  average: { type: Number, required: true }, // Added average
  grade: { type: String, required: true },
  published: { type: Boolean, default: false } // Added published status
}, { timestamps: true });

module.exports = mongoose.model('Result', ResultSchema);
