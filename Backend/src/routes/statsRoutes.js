import express from 'express';
import { getNeighborhoodStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/stats', getNeighborhoodStats);

export default router;
