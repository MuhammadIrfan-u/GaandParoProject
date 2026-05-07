import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformConversation = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    lastMessage: data.last_message,
    lastMessageTime: data.last_message_time,
    unreadCount: data.unread_count || 0,
    isGroup: data.is_group || false,
    groupName: data.group_name,
    participants: data.conversation_participants?.map(p => p.users?.name) || [],
    participantAvatars: data.conversation_participants?.map(p => p.users?.avatar) || [],
    participantIds: data.conversation_participants?.map(p => String(p.user_id)) || [],
  };
};

const transformMessage = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    conversationId: String(data.conversation_id),
    senderId: String(data.sender_id),
    content: data.content,
    timestamp: data.timestamp,
    read: data.read || false,
    image: data.image,
    isEdited: data.is_edited || false,
  };
};

// Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;

    // Get conversation IDs where the user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', numericUserId);
    
    if (participantError) throw participantError;
    
    const conversationIds = participantData.map(p => p.conversation_id);
    
    if (conversationIds.length === 0) return res.json([]);

    const { data, error } = await supabase
      .from('conversations')
      .select('*, conversation_participants(user_id, users(name, avatar))')
      .in('id', conversationIds)
      .order('last_message_time', { ascending: false });
    
    if (error) throw error;
    res.json((data || []).map(transformConversation));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    res.json((data || []).map(transformMessage));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, content, image } = req.body;
    const userId = req.headers['x-user-id'];
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: parseInt(conversationId),
        sender_id: numericUserId,
        content,
        image,
        timestamp: new Date().toISOString(),
        read: false,
        moderation_status: 'active',
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    res.status(201).json(transformMessage(data));
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get or create a conversation between two users
router.post('/conversations/get-or-create', async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.headers['x-user-id'];
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;
    const numericParticipantId = parseInt(String(participantId).replace(/\D/g, ''), 10) || 0;

    // Check if conversation exists
    const { data: existingParticipants, error: searchError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', numericUserId);
    
    if (searchError) throw searchError;

    const conversationIds = existingParticipants.map(p => p.conversation_id);
    
    const { data: commonConversations, error: commonError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('user_id', numericParticipantId);
    
    if (commonError) throw commonError;

    if (commonConversations && commonConversations.length > 0) {
      // Find one that is not a group
      const convId = commonConversations[0].conversation_id;
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*, conversation_participants(user_id, users(name, avatar))')
        .eq('id', convId)
        .eq('is_group', false)
        .single();
      
      if (!convError && convData) {
        return res.json(transformConversation(convData));
      }
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        is_group: false,
        unread_count: 0,
      }])
      .select()
      .single();
    
    if (createError) throw createError;

    // Add participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: numericUserId },
        { conversation_id: newConv.id, user_id: numericParticipantId }
      ]);

    const { data: finalData, error: finalError } = await supabase
      .from('conversations')
      .select('*, conversation_participants(user_id, users(name, avatar))')
      .eq('id', newConv.id)
      .single();
    
    if (finalError) throw finalError;
    res.status(201).json(transformConversation(finalData));
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
