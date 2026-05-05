import express from 'express';
import { getUserById } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// REQ-12: inter-module user lookup
router.get('/:id', protect, getUserById);

export default router;
