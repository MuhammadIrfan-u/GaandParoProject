import express from 'express';
import { supabase } from '../supabaseClient.js';
import * as marketplaceItemFraudService from '../services/marketplaceItemFraud.service.js';

const router = express.Router();

const transformItem = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    sellerId: String(data.seller_id),
    title: data.title,
    description: data.description,
    price: data.price,
    condition: data.condition,
    category: data.category,
    images: data.images || [],            // array of public URLs (new)
    image: (data.images || [])[0] || null, // backwards-compat alias
    postedDate: data.posted_date,
    status: data.status || 'active',
    isFlagged: data.is_flagged || false,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status || 'active',
  };
};

// Get marketplace items
router.get('/marketplace', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('posted_date', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(transformItem));
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create marketplace item
// Expects JSON body: { sellerId, neighborhoodId, title, description, price,
//                      condition, category, imageUrls?: string[] }
// Image uploads are handled by the main /api/marketplace route (marketplaceRoutes.js).
// This lightweight route accepts pre-resolved imageUrls[] from the frontend.
router.post('/marketplace', async (req, res) => {
  try {
    const item = req.body;
    const numericSellerId = parseInt(String(item.sellerId).replace(/\D/g, ''), 10) || 0;
    const numericPrice = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;

    // Accept up to 3 pre-uploaded image URLs
    let images = [];
    if (Array.isArray(item.images)) {
      images = item.images.slice(0, 3);
    } else if (Array.isArray(item.imageUrls)) {
      images = item.imageUrls.slice(0, 3);
    }

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        seller_id: numericSellerId,
        neighborhood_id: item.neighborhoodId,
        title: item.title,
        description: item.description,
        price: numericPrice,
        condition: item.condition,
        category: item.category,
        images,                            // array column
        posted_date: new Date().toISOString(),
        status: 'active',
        moderation_status: 'active',
      }])
      .select()
      .single();
    if (error) throw error;

    // Background Fraud Check
    marketplaceItemFraudService.check({
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
    }).catch(err => console.error('Marketplace item fraud check error:', err));

    res.status(201).json(transformItem(data));
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;