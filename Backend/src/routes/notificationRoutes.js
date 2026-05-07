import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.post('/notifications/read-all', markAllAsRead);

export default router;
