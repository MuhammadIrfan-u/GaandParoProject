import { supabase } from '../supabaseClient.js';

const transformNotification = (data) => ({
    id: data.id.toString(),
    userId: data.user_id?.toString(),
    type: data.type,
    title: data.title,
    message: data.message,
    timestamp: data.timestamp,
    read: data.read,
    actionUrl: data.action_url,
    itemId: data.item_id?.toString(),
    itemType: data.item_type,
});

export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', parseInt(userId))
            .order('timestamp', { ascending: false });

        if (error) throw error;

        const transformedData = (data || []).map(transformNotification);
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(transformNotification(data));
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', parseInt(userId))
            .eq('read', false);

        if (error) throw error;

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: error.message });
    }
};
