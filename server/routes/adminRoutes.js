const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../config/auth');

router.post('/login', adminController.login);
router.post('/add-student', auth, adminController.addStudent);
router.put('/update-student/:id', auth, adminController.updateStudent);
router.delete('/delete-student/:id', auth, adminController.deleteStudent);
router.post('/add-result', auth, adminController.addResult);
router.get('/results', auth, adminController.getAllResults);
router.put('/update-result/:id', auth, adminController.updateResult);
router.get('/students', auth, adminController.getAllStudents);

module.exports = router;
