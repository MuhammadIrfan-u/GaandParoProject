import express from 'express';
const router = express.Router();

import userFraudController from '../controllers/userFraud.controller.js';
import postFraudController from '../controllers/postFraud.controller.js';
import marketplaceItemFraudController from '../controllers/marketplaceItemFraud.controller.js';
import eventFraudController from '../controllers/eventFraud.controller.js';
import alertFraudController from '../controllers/alertFraud.controller.js';
import reviewFraudController from '../controllers/reviewFraud.controller.js';
import commentFraudController from '../controllers/commentFraud.controller.js';
import serviceFraudController from '../controllers/serviceFraud.controller.js';
import messageFraudController from '../controllers/messageFraud.controller.js';

// POST /api/fraud/check/user
router.post('/user', userFraudController.check);

// POST /api/fraud/check/post
router.post('/post', postFraudController.check);

// POST /api/fraud/check/marketplace-item
router.post('/marketplace-item', marketplaceItemFraudController.check);

// POST /api/fraud/check/event
router.post('/event', eventFraudController.check);

// POST /api/fraud/check/alert
router.post('/alert', alertFraudController.check);

// POST /api/fraud/check/review
router.post('/review', reviewFraudController.check);

// POST /api/fraud/check/comment
router.post('/comment', commentFraudController.check);

// POST /api/fraud/check/service
router.post('/service', serviceFraudController.check);

// POST /api/fraud/check/message
router.post('/message', messageFraudController.check);

export default router;
