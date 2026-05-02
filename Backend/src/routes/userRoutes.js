const express = require('express');
const router = express.Router();
const { getUserById } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

// ── REQ-12: inter-module user lookup ─────────────────────────────────────────
// Other modules call GET /api/users/:id to get a user's public profile
router.get('/:id', protect, getUserById);

module.exports = router;
