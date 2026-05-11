import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

/**
 * Get all users who are admins of at least one neighborhood.
 * This links the neighborhoods table with the users table.
 */
router.get('/superadmin/admins', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select(`
        admin_id,
        id,
        name,
        users!neighborhoods_admin_id_fkey (
          id,
          name,
          email
        )
      `)
      .not('admin_id', 'is', null);

    if (error) throw error;
    
    // De-duplicate users if they manage multiple neighborhoods
    const adminMap = new Map();
    data.forEach(item => {
      if (item.users) {
        if (!adminMap.has(item.admin_id)) {
          adminMap.set(item.admin_id, {
            userId: item.admin_id,
            userName: item.users.name,
            userEmail: item.users.email,
            neighborhoods: []
          });
        }
        adminMap.get(item.admin_id).neighborhoods.push({
          id: item.id,
          name: item.name
        });
      }
    });

    res.json(Array.from(adminMap.values()));
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Promote a user to Superadmin status.
 * Adds record to "Superadmin" table and creates a notification.
 */
router.post('/superadmin/add', async (req, res) => {
  try {
    const { userId, description, neighborhoodId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 1. Add to Superadmin table
    const { error: superadminError } = await supabase
      .from('Superadmin')
      .insert({ user_id: userId });

    if (superadminError) {
      // Handle potential duplicate
      if (superadminError.code === '23505') {
        return res.status(400).json({ error: 'User is already a Superadmin' });
      }
      throw superadminError;
    }

    // 2. Add to Notifications table
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        neighborhood_id: neighborhoodId || null,
        type: 'superadmin_promotion',
        title: 'Promoted to Super Admin',
        message: description || 'You have been promoted to Super Admin status.',
        timestamp: new Date().toISOString(),
        read: false
      });

    if (notificationError) {
      console.warn('Superadmin added but notification failed:', notificationError);
    }

    res.json({ success: true, message: 'Superadmin added successfully' });
  } catch (error) {
    console.error('Error adding superadmin:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
