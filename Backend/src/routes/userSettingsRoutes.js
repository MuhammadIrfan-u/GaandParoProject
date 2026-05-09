import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Get settings for a user
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', parseInt(userId))
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw error;
    }

    res.json(data || {
      user_id: parseInt(userId),
      push_notifications: true,
      community_alerts: true,
      profile_visibility: true,
      show_phone_number: false
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upsert settings
router.post('/settings', async (req, res) => {
  try {
    const { userId, ...settings } = req.body;

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: parseInt(userId),
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error upserting settings:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
