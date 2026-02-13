const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper: Calculate Grade
const calculateResultData = (subjects) => {
  const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'U': 0, 'RA': 0, 'SA': 0, 'W': 0
  };

  const sanitizedSubjects = subjects.map(s => ({
    subjectName: s.subjectName,
    subjectCode: String(s.subjectCode || '').trim().toUpperCase(),
    grade: String(s.grade || 'U').toUpperCase().trim(),
    credits: Number(s.credits) || 0
  }));

  let totalPoints = 0;
  let totalCredits = 0;

  sanitizedSubjects.forEach(sub => {
    const points = gradePoints[sub.grade] || 0;
    totalPoints += (points * sub.credits);
    totalCredits += sub.credits;
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  
  // Overall status
  const hasFailed = sanitizedSubjects.some(s => ['U', 'RA', 'SA'].includes(s.grade));
  const finalGrade = hasFailed ? 'FAIL' : (gpa >= 9 ? 'O' : gpa >= 8 ? 'A+' : gpa >= 7 ? 'A' : gpa >= 6 ? 'B+' : gpa >= 5 ? 'B' : 'C');

  return { 
    sanitizedSubjects, 
    total: totalPoints, 
    average: gpa, // Average is used as GPA
    grade: finalGrade 
  };
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
  const { department, semester, subjects } = req.body;
  try {
    const cleanDept = String(department || '').trim().toUpperCase();
    const cleanSubjects = subjects.map(s => ({
      name: String(s.name || '').trim(),
      code: String(s.code || '').trim().toUpperCase(),
      credits: Number(s.credits || 0)
    })).filter(s => s.name !== '');

    const updated = await Subject.findOneAndUpdate(
      { department: cleanDept, semester: Number(semester) },
      { department: cleanDept, semester: Number(semester), subjects: cleanSubjects },
      { upsert: true, new: true }
    );

    // Back-propagate updates to existing results
    const existingResults = await Result.find({ department: cleanDept, semester: Number(semester) });
    
    if (existingResults.length > 0) {
      const subjectMap = {};
      cleanSubjects.forEach(s => {
        subjectMap[s.name.toUpperCase()] = { code: s.code, credits: s.credits };
      });

      for (const result of existingResults) {
        let modified = false;
        
        // Update subjects with new metadata
        // Use manual mapping to avoid Mongoose serialization issues
        const updatedSubjects = result.subjects.map(sub => {
          const sName = sub.subjectName; // Direct access works best on subdocs
          const sCode = sub.subjectCode;
          const sGrade = sub.grade;
           // Ensure verification of existing credits, default to 0 if missing
          const sCredits = typeof sub.credits === 'number' ? sub.credits : 0;

          if (!sName) return null; // Skip malformed entries

          const key = sName.toUpperCase().trim();
          let newCode = sCode;
          let newCredits = sCredits;

          if (subjectMap[key]) {
             // If matched, force update to curriculum values
             if (newCode !== subjectMap[key].code || newCredits !== subjectMap[key].credits) {
                newCode = subjectMap[key].code;
                newCredits = subjectMap[key].credits;
                modified = true; 
             }
          } else if (!newCode) {
             // Fix missing codes for validation
             newCode = '---';
             modified = true;
          }

          return { 
            subjectName: sName, 
            subjectCode: newCode, 
            credits: newCredits, 
            grade: sGrade 
          };
        }).filter(s => s !== null);

        if (modified) {
          // Recalculate GPA/Total
          const { sanitizedSubjects, total, average, grade } = calculateResultData(updatedSubjects);
          
          result.subjects = sanitizedSubjects;
          result.total = total;
          result.average = average;
          result.grade = grade;
          
          await result.save();
        }
      }
    }

    res.json({ message: "Curriculum updated and synced with existing results", updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjects = async (req, res) => {
  const { department, semester } = req.query;
  try {
    const map = await Subject.findOne({ department: String(department).toUpperCase(), semester: Number(semester) });
    res.json(map ? map.subjects : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSubjectMaps = async (req, res) => {
  try {
    const maps = await Subject.find().sort({ department: 1, semester: 1 });
    res.json(maps);
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
    const cleanDept = String(department || '').trim().toUpperCase();
    const cleanBatch = String(batch || '').trim().toUpperCase();
    
    const query = { batch: cleanBatch, semester: Number(semester) };
    if (cleanDept !== 'ALL') {
      query.department = cleanDept;
    }

    const result = await Result.updateMany(query, { published: true });
    res.json({ message: `Successfully published ${result.modifiedCount} results` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleResultStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ message: "Result not found" });
    
    result.published = !result.published;
    await result.save();
    res.json({ message: `Result ${result.published ? 'published' : 'moved to draft'}`, published: result.published });
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
