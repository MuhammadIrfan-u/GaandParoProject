import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformPost = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    authorId: data.author_id,
    content: data.content,
    image: data.image,
    likes: data.likes || 0,
    category: data.category,
    isFlagged: data.is_flagged || false,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status || 'active',
  };
};

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    res.json((data || []).map(transformPost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  try {
    const post = req.body;
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id: String(post.authorId),
        content: post.content,
        image: post.image,
        likes: 0,
        category: post.category,
        moderation_status: 'active',
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(transformPost(data));
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
