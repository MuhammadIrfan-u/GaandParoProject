import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformUser = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatar: data.avatar,
    verified: data.verified || false,
    reputation: data.reputation || 0,
    joinedDate: data.joined_date,
    bio: data.bio,
    isAdmin: data.is_admin || false,
    isProvider: data.isProvider || false,
  };
};

// Upsert user (used for seeding/testing)
router.post('/users/upsert', async (req, res) => {
  try {
    const user = req.body;
    const numericId = parseInt(String(user.id ?? '').replace(/\D/g, ''), 10) || 1;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: numericId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        verified: user.verified,
        reputation: user.reputation,
        joined_date: user.joinedDate || new Date().toISOString(),
        bio: user.bio,
        is_admin: user.isAdmin,
        isProvider: user.isProvider || user.isServiceProvider,
        password_hash: 'test_hash', // Dummy for now
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(transformUser(data));
  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(transformUser(data));
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

export default router;
