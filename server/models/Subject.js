const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  subjects: [
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      credits: { type: Number, required: true, default: 0 }
    }
  ]
});

// Unique index to prevent duplicate subject maps for same dept/sem
SubjectSchema.index({ department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
