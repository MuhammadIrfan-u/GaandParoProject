import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformApplication = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    // fullName might be in description if we injected it, but we'll try to extract it later if needed.
    category: data.category,
    experience: data.experience,
    description: data.description,
    status: data.status || 'pending',
    submittedDate: data.created_at || new Date().toISOString(),
  };
};

router.post('/provider-applications', async (req, res) => {
  try {
    const { userId, category, experience, description } = req.body;
    
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);

    if (isNaN(numericUserId) || !category || !experience) {
      return res.status(400).json({ error: 'Missing or invalid required fields (userId, category, experience)' });
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .insert([{
        user_id: numericUserId,
        category,
        experience,
        description,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(transformApplication(data));
  } catch (error) {
    console.error('Error creating provider application:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/provider-applications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    
    res.json((data || []).map(transformApplication));
  } catch (error) {
    console.error('Error fetching provider applications:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
