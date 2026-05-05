import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformRequest = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    serviceId: data.service_id,
    status: data.status || 'pending',
    requestDate: data.request_date,
    scheduledDate: data.scheduled_date,
    description: data.description,
  };
};

router.post('/service-requests', async (req, res) => {
  try {
    const { userId, serviceId, description, scheduledDate } = req.body;
    
    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);
    const numericServiceId = parseInt(String(serviceId).replace(/\D/g, ''), 10);

    if (isNaN(numericUserId) || isNaN(numericServiceId) || !description) {
      return res.status(400).json({ error: 'Missing or invalid required fields (userId, serviceId, description)' });
    }
    
    const { data, error } = await supabase
      .from('service_requests')
      .insert([{
        user_id: numericUserId,
        service_id: numericServiceId,
        status: 'pending',
        request_date: new Date().toISOString(),
        scheduled_date: scheduledDate || null,
        description,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(transformRequest(data));
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/service-requests', async (req, res) => {
  try {
    const { userId, providerId } = req.query;
    let query = supabase.from('service_requests').select('*').order('request_date', { ascending: false });
    
    if (userId) {
      const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;
      query = query.eq('user_id', numericUserId);
    }
    
    // For providerId, we would normally join with services, but we can do that in the frontend 
    // or pass multiple serviceIds. For simplicity, we just return all if providerId is passed and filter in frontend, 
    // OR filter by service_id if provided.
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json((data || []).map(transformRequest));
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
