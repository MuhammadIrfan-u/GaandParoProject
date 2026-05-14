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
router.post('/get-or-create', async (req, res) => {
    // We'll implement this inline or in controller. 
    // It's similar to the first part of sendMessage.
    const { user1, user2 } = req.body;
    try {
        const { data: existingParticipantData } = await supabase
            .rpc('find_common_conversation', { p_user1: parseInt(user1), p_user2: parseInt(user2) });

        if (existingParticipantData && existingParticipantData.length > 0) {
            return res.json({ conversationId: existingParticipantData[0].conversation_id });
        }
        
        // Create new
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert([{ last_message: '', last_message_time: new Date().toISOString() }])
            .select()
            .single();

        if (createError) throw createError;
        const convId = newConv.id;

        await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: convId, user_id: parseInt(user1) },
                { conversation_id: convId, user_id: parseInt(user2) }
            ]);

        res.json({ conversationId: convId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
