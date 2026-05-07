import express from 'express';
import { supabase } from '../supabaseClient.js';

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
    image: data.image,
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
      .order('posted_date', { ascending: false });
    
    if (error) throw error;
    res.json((data || []).map(transformItem));
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create marketplace item
router.post('/marketplace', async (req, res) => {
  try {
    const item = req.body;
    const numericSellerId = parseInt(String(item.sellerId).replace(/\D/g, ''), 10) || 0;
    const numericPrice = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        seller_id: numericSellerId,
        title: item.title,
        description: item.description,
        price: numericPrice,
        condition: item.condition,
        category: item.category,
        image: item.image,
        posted_date: new Date().toISOString(),
        status: 'active',
        moderation_status: 'active',
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(transformItem(data));
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
