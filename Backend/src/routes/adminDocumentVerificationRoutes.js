import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/adminDocumentVerificationController.js';

const router = express.Router();

router.get('/neighborhoods/:neighborhoodId/documents', requireAuth, controller.listDocumentsByNeighborhood);
router.patch('/neighborhoods/:neighborhoodId/documents/:docId/status', requireAuth, controller.changeDocumentStatus);

export default router;
