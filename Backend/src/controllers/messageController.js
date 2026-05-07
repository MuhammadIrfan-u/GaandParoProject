import { supabase } from '../supabaseClient.js';

const transformMessage = (data) => ({
    id: data.id.toString(),
    conversationId: data.conversation_id.toString(),
    senderId: data.sender_id.toString(),
    sender: data.users?.name || 'Unknown User',
    senderAvatar: data.users?.avatar || (data.users?.name ? data.users.name.charAt(0) : 'U'),
    content: data.content,
    timestamp: data.timestamp,
    read: data.read,
    image: data.image
});

const transformConversation = (data, currentUserId) => {
    // Determine the recipient (other participant)
    const participants = data.conversation_participants || [];
    const otherParticipant = participants.find(p => p.user_id.toString() !== currentUserId.toString())?.users || {};
    
    return {
        id: data.id.toString(),
        participantIds: participants.map(p => p.user_id.toString()),
        participants: [otherParticipant.name || 'Unknown User'],
        participantAvatars: [otherParticipant.avatar || (otherParticipant.name ? otherParticipant.name.charAt(0) : 'U')],
        lastMessage: data.last_message || '',
        lastMessageTime: data.last_message_time || '',
        unreadCount: data.unread_count || 0,
        isGroup: data.is_group || false,
        groupName: data.group_name
    };
};

export const getConversations = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        // 1. Get all conversation IDs where current user is a participant
        const { data: participantData, error: participantError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', parseInt(userId));

        if (participantError) throw participantError;

        const conversationIds = participantData.map(p => p.conversation_id);

        if (conversationIds.length === 0) {
            return res.json([]);
        }

        // 2. Fetch conversation details with other participants
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (
                    user_id,
                    users (
                        name,
                        avatar
                    )
                )
            `)
            .in('id', conversationIds)
            .order('last_message_time', { ascending: false });

        if (error) throw error;

        const transformedData = (data || []).map(conv => transformConversation(conv, userId));
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                users:sender_id (
                    name,
                    avatar
                )
            `)
            .eq('conversation_id', parseInt(conversationId))
            .order('timestamp', { ascending: true });

        if (error) throw error;

        const transformedData = (data || []).map(transformMessage);
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { senderId, recipientId, content, conversationId, image } = req.body;

        if (!senderId || (!recipientId && !conversationId) || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let convId = conversationId;

        // 1. If no conversationId, check if one exists or create a new one
        if (!convId) {
            // Check for existing private conversation
            const { data: existingParticipantData, error: findError } = await supabase
                .rpc('find_common_conversation', { p_user1: parseInt(senderId), p_user2: parseInt(recipientId) });

            if (existingParticipantData && existingParticipantData.length > 0) {
                convId = existingParticipantData[0].conversation_id;
            } else {
                // Fallback: Manually check for existing private conversation
                const { data: user1Convs } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', parseInt(senderId));
                
                const { data: user2Convs } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', parseInt(recipientId));
                
                const commonConv = user1Convs?.find(c1 => 
                    user2Convs?.some(c2 => c2.conversation_id === c1.conversation_id)
                );

                if (commonConv) {
                    convId = commonConv.conversation_id;
                } else {
                    // Create new conversation
                    const { data: newConv, error: createError } = await supabase
                        .from('conversations')
                        .insert([{ last_message: content, last_message_time: new Date().toISOString() }])
                        .select()
                        .single();

                    if (createError) throw createError;
                    convId = newConv.id;

                    // Add participants
                    const { error: partError } = await supabase
                        .from('conversation_participants')
                        .insert([
                            { conversation_id: convId, user_id: parseInt(senderId) },
                            { conversation_id: convId, user_id: parseInt(recipientId) }
                        ]);

                    if (partError) throw partError;
                }
            }
        }

        // 2. Insert the message
        const { data: newMessage, error: msgError } = await supabase
            .from('messages')
            .insert([{
                conversation_id: parseInt(convId),
                sender_id: parseInt(senderId),
                content,
                image: image || '',
                timestamp: new Date().toISOString()
            }])
            .select(`
                *,
                users:sender_id (
                    name,
                    avatar
                )
            `)
            .single();

        if (msgError) throw msgError;

        // 3. Update conversation last message
        await supabase
            .from('conversations')
            .update({
                last_message: content,
                last_message_time: new Date().toISOString()
            })
            .eq('id', convId);

        res.status(201).json(transformMessage(newMessage));
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;

        const { data, error } = await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', parseInt(messageId))
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Marked as read', data });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getNeighborhoodMembers = async (req, res) => {
    try {
        const { neighborhoodId } = req.params;
        const { currentUserId } = req.query;

        // 1. Get all user IDs in this neighborhood
        const { data: memberData, error: memberError } = await supabase
            .from('neighborhood_members')
            .select('user_id')
            .eq('neighborhood_id', parseInt(neighborhoodId));

        if (memberError) throw memberError;

        const userIds = memberData.map(m => m.user_id).filter(id => id !== currentUserId?.toString());

        if (userIds.length === 0) {
            return res.json([]);
        }

        // 2. Fetch user details for these IDs
        // We handle potential type mismatch by casting if needed, but 'in' usually works if values match
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar, verified')
            .in('id', userIds);

        if (userError) throw userError;

        res.json(users || []);
    } catch (error) {
        console.error('Error fetching neighborhood members:', error);
        res.status(500).json({ error: error.message });
    }
};
