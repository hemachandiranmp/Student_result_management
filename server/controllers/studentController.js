const Student = require('../models/Student');
const Result = require('../models/Result');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Student Login (Supports Roll Number or Email)
exports.login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be rollNo or email
  try {
    const student = await Student.findOne({
      $or: [{ rollNo: identifier }, { email: identifier }]
    });
    
    if (!student) return res.status(404).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: student._id, rollNo: student.rollNo, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: 'student', rollNo: student.rollNo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View Result
exports.viewResult = async (req, res) => {
  try {
    const student = await Student.findOne({ rollNo: req.params.rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    const results = await Result.find({ studentId: student._id });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select('-password');
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
