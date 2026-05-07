import express from 'express';
import { 
    getConversations, 
    getMessages, 
    sendMessage, 
    markAsRead, 
    getNeighborhoodMembers 
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:messageId/read', markAsRead);
router.get('/neighborhood/:neighborhoodId/members', getNeighborhoodMembers);

export default router;
