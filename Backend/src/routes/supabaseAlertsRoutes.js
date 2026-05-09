import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformAlert = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    authorId: String(data.author_id),
    type: data.type,
    title: data.title,
    description: data.description,
    timestamp: data.timestamp,
    severity: data.severity,
    resolved: data.resolved || false,
    isFlagged: data.is_flagged || false,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status || 'active',
  };
};

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    res.json((data || []).map(transformAlert));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create alert
router.post('/alerts', async (req, res) => {
  try {
    const alert = req.body;
    const numericAuthorId = parseInt(String(alert.authorId).replace(/\D/g, ''), 10) || 0;

    const { data, error } = await supabase
      .from('alerts')
      .insert([{
        author_id: numericAuthorId,
        neighborhood_id: alert.neighborhood_id,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        timestamp: new Date().toISOString(),
        severity: alert.severity,
        resolved: false,
        moderation_status: 'active',
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(transformAlert(data));
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
