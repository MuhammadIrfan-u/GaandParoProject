import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformReview = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    reviewerId: String(data.reviewer_id),
    targetId: String(data.target_id),
    targetType: data.target_type,
    rating: data.rating,
    comment: data.comment,
    timestamp: data.timestamp,
    isFlagged: data.is_flagged || false,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status || 'approved',
    createdAt: data.created_at,
    neighborhoodId: String(data.neighborhod_id),
    reviewer: data.users?.name || 'Unknown User',
    reviewerAvatar: data.users?.avatar || 'U',
  };
};

// Get reviews with filters
router.get('/reviews', async (req, res) => {
  try {
    const { neighborhoodId, type } = req.query;
    let query = supabase
      .from('reviews')
      .select('*, users(name, avatar)')
      .order('created_at', { ascending: false });
    
    if (neighborhoodId) {
      query = query.eq('neighborhod_id', neighborhoodId);
    }
    
    if (type && type !== 'all') {
      query = query.eq('target_type', type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json((data || []).map(transformReview));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post('/reviews', async (req, res) => {
  try {
    const review = req.body;
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id: parseInt(review.reviewerId),
        target_id: parseInt(review.targetId),
        target_type: review.targetType,
        rating: review.rating,
        comment: review.comment,
        neighborhod_id: parseInt(review.neighborhoodId),
        moderation_status: 'approved',
      }])
      .select('*, users(name, avatar)')
      .single();
    
    if (error) throw error;
    res.status(201).json(transformReview(data));
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update review (within 24 hours)
router.put('/reviews/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rating, comment, reviewerId } = req.body;
    
    // Check if review exists and was created within 24 hours
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('created_at, reviewer_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) return res.status(404).json({ error: 'Review not found' });
    if (String(existing.reviewer_id) !== String(reviewerId)) {
      return res.status(403).json({ error: 'Unauthorized to edit this review' });
    }

    const createdTime = new Date(existing.created_at).getTime();
    const now = new Date().getTime();
    if (now - createdTime > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ error: 'Review can only be edited within 24 hours' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, comment })
      .eq('id', id)
      .select('*, users(name, avatar)')
      .single();
    
    if (error) throw error;
    res.json(transformReview(data));
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete review (within 24 hours)
router.delete('/reviews/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reviewerId } = req.query;

    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('created_at, reviewer_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) return res.status(404).json({ error: 'Review not found' });
    if (String(existing.reviewer_id) !== String(reviewerId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    const createdTime = new Date(existing.created_at).getTime();
    const now = new Date().getTime();
    if (now - createdTime > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ error: 'Review can only be deleted within 24 hours' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
