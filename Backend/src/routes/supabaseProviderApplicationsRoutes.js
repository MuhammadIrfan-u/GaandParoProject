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
    const { userId, category, experience, description, neighborhoodId } = req.body;
    
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);
    const numericNeighborhoodId = neighborhoodId ? parseInt(String(neighborhoodId).replace(/\D/g, ''), 10) : NaN;

    if (isNaN(numericUserId) || !category || !experience || isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Missing or invalid required fields (userId, category, experience, neighborhoodId)' });
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .insert([{
        user_id: numericUserId,
        neighborhood_id: numericNeighborhoodId,
        category,
        experience,
        description,
        status: 'pending',
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
    const { neighborhoodId } = req.query;
    const numericNeighborhoodId = neighborhoodId ? parseInt(String(neighborhoodId).replace(/\D/g, ''), 10) : NaN;

    let query = supabase
      .from('provider_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by neighborhood if provided
    if (!isNaN(numericNeighborhoodId)) {
      query = query.eq('neighborhood_id', numericNeighborhoodId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json((data || []).map(transformApplication));
  } catch (error) {
    console.error('Error fetching provider applications:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
