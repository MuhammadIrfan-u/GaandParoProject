import { supabase } from '../supabaseClient.js';
import * as alertFraudService from '../services/alertFraud.service.js';

const transformAlert = (data) => ({
    id: data.id.toString(),
    authorId: data.author_id?.toString(),
    author: data.users?.name || 'Unknown User',
    type: data.type,
    title: data.title,
    description: data.description,
    timestamp: data.timestamp,
    severity: data.severity,
    resolved: data.resolved,
    isFlagged: data.is_flagged,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status,
});

export const getAlerts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('alerts')
            .select('*, users(name)')
            .eq('moderation_status', 'approved')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        const transformedData = (data || []).map(transformAlert);
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createAlert = async (req, res) => {
    try {
        const { authorId, type, title, description, severity } = req.body;

        if (!authorId || !title || !description) {
            return res.status(400).json({ error: 'Missing required fields: authorId, title, description' });
        }

        // 1. Create the alert
        const { data: alertData, error: alertError } = await supabase
            .from('alerts')
            .insert([{
                author_id: parseInt(authorId),
                type,
                title,
                description,
                severity: severity || 'medium',
                timestamp: new Date().toISOString(),
                resolved: false,
                moderation_status: 'approved'
            }])
            .select('*, users(name)')
            .single();

        if (alertError) throw alertError;

        // Background Fraud Check
        alertFraudService.check({
            id: alertData.id,
            title: alertData.title,
            description: alertData.description
        }).catch(err => console.error('Alert fraud check error:', err));

        // 2. Notify all community members (all users for now, as requested)
        // Optimization: In a real app, you'd only notify members of the same neighborhood.
        // But the user said "notify the user of all neighborhoods".
        const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id')
            .neq('id', parseInt(authorId)); // Don't notify the author

        if (usersError) {
            console.error('Error fetching users for notification:', usersError);
        } else if (allUsers && allUsers.length > 0) {
            const notifications = allUsers.map(user => ({
                user_id: user.id,
                type: 'alert',
                title: `New Alert: ${title}`,
                message: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
                timestamp: new Date().toISOString(),
                read: false,
                item_id: alertData.id,
                item_type: 'alert'
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);
            if (notifyError) {
                console.error('Error creating notifications:', notifyError);
            }
        }

        res.status(201).json(transformAlert(alertData));
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, title, description, severity, resolved } = req.body;

        const { data, error } = await supabase
            .from('alerts')
            .update({
                type,
                title,
                description,
                severity,
                resolved
            })
            .eq('id', id)
            .select('*, users(name)')
            .single();

        if (error) throw error;

        res.json(transformAlert(data));
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('alerts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: error.message });
    }
};
