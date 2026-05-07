import express from 'express';
import {
    getAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
} from '../controllers/alertController.js';

const router = express.Router();

router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);

export default router;
