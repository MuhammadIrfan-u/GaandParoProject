import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe } from '../controllers/authController.js';
import { getProfile, updateProfile, deleteProfile, changePassword } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);
router.put('/change-password', protect, changePassword);

export default router;
