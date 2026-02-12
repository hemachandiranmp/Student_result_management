const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper: Calculate Grade
const calculateResultData = (subjects) => {
  const sanitizedSubjects = subjects.map(s => ({
    subjectName: s.subjectName,
    marks: Number(s.marks) || 0
  }));
  const total = sanitizedSubjects.reduce((acc, sub) => acc + sub.marks, 0);
  const average = total / sanitizedSubjects.length;
  const percentage = (total / (sanitizedSubjects.length * 100)) * 100;
  
  let grade;
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  else grade = 'F';

  return { sanitizedSubjects, total, average, grade };
};

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

// --- STUDENT MANAGEMENT ---

// Bulk Add Students (from Excel JSON)
exports.bulkAddStudents = async (req, res) => {
  const { students } = req.body; // Expecting array of {fullName, rollNumber, email, department, batchYear}
  try {
    const studentsToInsert = await Promise.all(students.map(async (s) => {
      const defaultPassword = 'Student@123';
      const rawPassword = String(s.password || defaultPassword).trim();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const cleanRoll = String(s.rollNumber || '').trim().toUpperCase();
      return {
        name: String(s.fullName || '').trim(),
        rollNo: cleanRoll,
        email: String(s.email || '').trim().toLowerCase(),
        department: String(s.department || '').trim().toUpperCase(),
        batch: String(s.batchYear || '').trim(),
        password: hashedPassword,
        displayPassword: rawPassword
      };
    }));

    // ordered: false allows continuing even if some fail (e.g. duplicate key)
    const result = await Student.insertMany(studentsToInsert, { ordered: false });
    res.status(201).json({ message: `${result.length} students enrolled successfully` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Bulk upload completed with some duplicates ignored.", partialSuccess: true });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.addStudent = async (req, res) => {
  const { name, rollNo, email, department, batch, password } = req.body;
  try {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    const cleanDept = String(department || '').trim().toUpperCase();
    const cleanEmail = String(email || '').trim().toLowerCase();
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({ 
      name: String(name).trim(), 
      rollNo: cleanRoll, 
      email: cleanEmail, 
      department: cleanDept, 
      batch: String(batch).trim(), 
      password: hashedPassword, 
      displayPassword: password 
    });
    await newStudent.save();
    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- SUBJECT MAPPING ---

exports.mapSubjects = async (req, res) => {
  const { department, semester, subjectNames } = req.body;
  try {
    const cleanDept = String(department || '').trim().toUpperCase();
    const cleanSubjects = subjectNames.map(s => String(s || '').trim()).filter(s => s !== '');

    const updated = await Subject.findOneAndUpdate(
      { department: cleanDept, semester: Number(semester) },
      { department: cleanDept, semester: Number(semester), subjectNames: cleanSubjects },
      { upsert: true, new: true }
    );
    res.json({ message: "Curriculum updated successfully", updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjects = async (req, res) => {
  const { department, semester } = req.query;
  try {
    const map = await Subject.findOne({ department, semester });
    res.json(map ? map.subjectNames : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- RESULT MANAGEMENT ---

exports.addResult = async (req, res) => {
  const { rollNo, semester, subjects } = req.body;
  try {
    const cleanRoll = String(rollNo || '').trim().toUpperCase();
    const student = await Student.findOne({ rollNo: cleanRoll });
    if (!student) return res.status(404).json({ message: "Student not found with this Credential ID" });

    const { sanitizedSubjects, total, average, grade } = calculateResultData(subjects);

    await Result.findOneAndUpdate(
      { studentId: student._id, semester: Number(semester) },
      { 
        studentId: student._id, 
        semester: Number(semester),
        department: student.department,
        batch: student.batch,
        subjects: sanitizedSubjects, 
        total, 
        average,
        grade 
      },
      { upsert: true, new: true }
    );
    
    res.status(201).json({ message: "Result saved locally" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.batchPublishResults = async (req, res) => {
  const { department, batch, semester } = req.body;
  try {
    const result = await Result.updateMany(
      { department, batch, semester: Number(semester) },
      { published: true }
    );
    res.json({ message: `Successfully published ${result.modifiedCount} results` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('studentId', 'name rollNo department batch');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateResult = async (req, res) => {
  const { id } = req.params;
  const { semester, subjects } = req.body;
  try {
    const { sanitizedSubjects, total, average, grade } = calculateResultData(subjects);
    const updatedResult = await Result.findByIdAndUpdate(id, {
      semester: Number(semester),
      subjects: sanitizedSubjects,
      total,
      average,
      grade
    }, { new: true });
    res.json({ message: "Result updated successfully", updatedResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Result.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);
    res.json({ message: "Student and their data removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteResult = async (req, res) => {
  const { id } = req.params;
  try {
    await Result.findByIdAndDelete(id);
    res.json({ message: "Scorecard removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
