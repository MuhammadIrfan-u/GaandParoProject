import express from 'express';
import { supabase } from '../supabaseClient.js';
import * as serviceFraudService from '../services/serviceFraud.service.js';

const router = express.Router();

const transformService = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    title: data.title,
    description: data.description,
    category: data.category,
    price: data.price ? `$${data.price}/hr` : 'Contact for price',
    availability: data.availability === true ? 'Available' : 'Unavailable',
    rating: data.rating || 5.0,
    reviewCount: data.review_count || 0,
    provider: data.users?.name || 'Unknown Provider',
    providerAvatar: data.users?.avatar || 'U',
    verified: data.users?.verified || false,
    status: data.moderation_status || 'active',
    providerId: String(data.provider_id),
    neighborhoodId: String(data.neighborhood_id),
  };
};

// Get all services
router.get('/services', async (req, res) => {
  try {
    const { neighborhoodId } = req.query;
    let query = supabase
      .from('services')
      .select('*, users(name, avatar, verified)')
      .order('id', { ascending: false });
    
    if (neighborhoodId) {
      query = query.eq('neighborhood_id', neighborhoodId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json((data || []).map(transformService));
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single service
router.get('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid service ID' });

    const { data, error } = await supabase
      .from('services')
      .select('*, users(name, avatar, verified)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json(transformService(data));
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create service
router.post('/services', async (req, res) => {
  try {
    const service = req.body;
    
    // Parse numeric values
    const rawPrice = service.price ?? 0;
    const numericPrice = parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 0;
    
    const rawProviderId = service.userId || service.providerId;
    const numericProviderId = parseInt(String(rawProviderId ?? '').replace(/\D/g, ''), 10);
    
    if (isNaN(numericProviderId)) {
      return res.status(400).json({ error: 'Valid provider ID required' });
    }

    const numericNeighborhoodId = parseInt(service.neighborhoodId, 10) || 1;
    
    const { data, error } = await supabase
      .from('services')
      .insert([{
        title: service.title,
        description: service.description,
        category: service.category,
        price: numericPrice,
        availability: true,
        provider_id: numericProviderId,
        neighborhood_id: numericNeighborhoodId,
        moderation_status: 'active',
      }])
      .select('*, users(name, avatar, verified)')
      .single();
    
    if (error) throw error;
    
    // Background Fraud Check
    serviceFraudService.check({
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category
    }).catch(err => console.error('Service fraud check error:', err));

    res.status(201).json(transformService(data));
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid service ID' });

    const service = req.body;
    const updateData = {};
    
    if (service.title) updateData.title = service.title;
    if (service.description) updateData.description = service.description;
    if (service.category) updateData.category = service.category;
    
    if (service.price !== undefined && service.price !== 'undefined') {
      updateData.price = parseFloat(String(service.price).replace(/[^\d.]/g, '')) || 0;
    }
    
    if (service.status) updateData.moderation_status = service.status;
    if (service.availability !== undefined) {
      updateData.availability = service.availability === 'Available' || service.availability === true;
    }

    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select('*, users(name, avatar, verified)')
      .single();
    
    if (error) throw error;
    res.json(transformService(data));
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid service ID' });

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
