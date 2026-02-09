const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Result = require('../models/Result');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: 'admin' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add Student
exports.addStudent = async (req, res) => {
  const { name, rollNo, email, department, batch, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({ 
      name, 
      rollNo, 
      email, 
      department, 
      batch, 
      password: hashedPassword, 
      displayPassword: password // Store plain text for admin visibility 
    });
    await newStudent.save();
    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Student
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, department, batch, password } = req.body;
  try {
    const updateData = { name, email, department, batch };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.displayPassword = password;
    }
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: "Student updated successfully", updatedStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    // Also delete results associated with the student
    await Result.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);
    
    res.json({ message: "Student and their results deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addResult = async (req, res) => {
  const { rollNo, semester, subjects } = req.body;
  try {
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Ensure marks are numbers and handle NaN
    const sanitizedSubjects = subjects.map(s => ({
      subjectName: s.subjectName,
      marks: Number(s.marks) || 0
    }));

    const total = sanitizedSubjects.reduce((acc, sub) => acc + sub.marks, 0);
    const percentage = (total / (sanitizedSubjects.length * 100)) * 100;
    
    let grade;
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else grade = 'F';

    // Check if result already exists for this student and semester
    let result = await Result.findOne({ studentId: student._id, semester: Number(semester) });
    
    if (result) {
      result.subjects = sanitizedSubjects;
      result.total = total;
      result.grade = grade;
      await result.save();
    } else {
      result = new Result({ 
        studentId: student._id, 
        semester: Number(semester),
        subjects: sanitizedSubjects, 
        total, 
        grade 
      });
      await result.save();
    }
    
    res.status(201).json({ message: "Result published successfully" });
  } catch (error) {
    console.error('Add Result Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Results
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('studentId', 'name rollNo department');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update existing Result
exports.updateResult = async (req, res) => {
  const { id } = req.params;
  const { semester, subjects } = req.body;
  try {
    const sanitizedSubjects = subjects.map(s => ({
      subjectName: s.subjectName,
      marks: Number(s.marks) || 0
    }));

    const total = sanitizedSubjects.reduce((acc, sub) => acc + sub.marks, 0);
    const percentage = (total / (sanitizedSubjects.length * 100)) * 100;
    
    let grade;
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else grade = 'F';

    const updatedResult = await Result.findByIdAndUpdate(id, {
      semester: Number(semester),
      subjects: sanitizedSubjects,
      total,
      grade
    }, { new: true });

    res.json({ message: "Result updated successfully", updatedResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
