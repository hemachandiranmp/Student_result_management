const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../config/auth');

router.post('/login', studentController.login);
router.get('/view-result/:rollNo', auth, studentController.viewResult);
router.get('/profile', auth, studentController.getProfile);

module.exports = router;
