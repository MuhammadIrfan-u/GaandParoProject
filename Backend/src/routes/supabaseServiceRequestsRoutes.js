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

    // Avoid returning every row when no scope is provided (consumer UIs always pass userId or providerId).
    if (!userId && !providerId) {
      return res.json([]);
    }

    // Join with services to get more info
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        services!service_requests_service_id_fkey (
          title,
          provider_id,
          users!services_provider_id_fkey (
            name
          )
        )
      `)
      .order('request_date', { ascending: false });
    
    if (userId) {
      const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;
      query = query.eq('user_id', numericUserId);
    }

    if (providerId) {
      const numericProviderId = parseInt(String(providerId).replace(/\D/g, ''), 10) || 0;
      query = query.eq('services.provider_id', numericProviderId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform and flatten the data
    const transformedData = (data || []).map(item => {
      const base = transformRequest(item);
      return {
        ...base,
        serviceName: item.services?.title || 'Unknown Service',
        provider: item.services?.users?.name || 'Unknown Provider',
        providerId: item.services?.provider_id
      };
    });

    // If providerId was filtered, we need to manually filter out nulls because of how Supabase join filtering works 
    // (Supabase returns the main record even if the joined record doesn't match the eq filter unless we use inner join)
    let finalData = transformedData;
    if (providerId) {
      finalData = transformedData.filter(item => item.providerId === parseInt(providerId));
    }
    
    res.json(finalData);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/service-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(transformRequest(data));
  } catch (error) {
    console.error('Error updating service request status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
