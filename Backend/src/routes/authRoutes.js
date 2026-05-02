const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { getProfile, updateProfile, deleteProfile, changePassword } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// ── Public routes ────────────────────────────────────────────────────────────
router.post('/register', register);           // REQ-1, REQ-2
router.post('/login', login);                 // REQ-3, REQ-4
router.post('/forgot-password', forgotPassword); // REQ-7, REQ-8
router.post('/reset-password', resetPassword);   // REQ-7, REQ-8

// ── Protected routes (JWT required) ─────────────────────────────────────────
router.get('/me', protect, getMe);                        // REQ-13: session validation
router.get('/profile', protect, getProfile);              // REQ-6.3
router.put('/profile', protect, updateProfile);           // REQ-6.2, REQ-9
router.delete('/profile', protect, deleteProfile);        // REQ-6.4
router.put('/change-password', protect, changePassword);  // security

module.exports = router;
