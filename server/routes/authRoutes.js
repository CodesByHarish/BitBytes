const express = require('express');
const router = express.Router();
const {
    registerStudent,
    registerManagement,
    loginStudent,
    loginManagement,
    refreshToken,
    logout,
    getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Signup routes
router.post('/signup/student', registerStudent);
router.post('/signup/management', registerManagement);

// Login routes
router.post('/login/student', loginStudent);
router.post('/login/management', loginManagement);

// Token routes
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected route
router.get('/me', protect, getMe);

module.exports = router;
