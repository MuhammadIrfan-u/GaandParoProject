import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.get('/admin/dashboard/:neighborhoodId', async (req, res) => {
  const { neighborhoodId } = req.params;
  
  try {
      const [
          usersRes,
          postsRes,
          eventsRes,
          alertsRes,
          marketplaceRes,
          applicationsRes,
          settingsRes
      ] = await Promise.all([
          supabase.from('neighborhood_members').select('user_id, users(*)').eq('neighborhood_id', neighborhoodId),
          supabase.from('posts').select('*').eq('neighborhod_id', neighborhoodId),
          supabase.from('events').select('*').eq('neighborhood_id', neighborhoodId),
          supabase.from('alerts').select('*').eq('neighborhood_id', neighborhoodId),
          supabase.from('marketplace_items').select('*'),
          supabase.from('provider_applications').select('*'),
          supabase.from('neighborhood_settings').select('*').eq('neighborhood_id', neighborhoodId).single()
      ]);

      const members = usersRes.data || [];
      const users = members.map(m => m.users).filter(Boolean);
      const posts = postsRes.data || [];
      const events = eventsRes.data || [];
      const alerts = alertsRes.data || [];
      const marketplaceItems = marketplaceRes.data || [];
      const applications = applicationsRes.data || [];
      const settings = settingsRes.data || {};
      
      const stats = {
          users: users.length,
          posts: posts.length,
          events: events.length,
          marketplaceItems: marketplaceItems.length,
          alerts: alerts.length
      };

      res.json({
          stats,
          users,
          posts,
          events,
          marketplaceItems,
          alerts,
          applications,
          settings
      });
  } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      res.status(500).json({ error: 'Failed to fetch admin dashboard data' });
  }
});

// Settings
router.put('/admin/neighborhood/:id/settings', async (req, res) => {
  const { id } = req.params;
  const { enable_marketplace, enable_resource_exchange, enable_public_alerts, enable_events, enable_services, require_verification } = req.body;
  const { error } = await supabase.from('neighborhood_settings').upsert({ 
    neighborhood_id: id,
    enable_marketplace,
    enable_resource_exchange,
    enable_public_alerts,
    enable_events,
    enable_services,
    require_verification
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Delete routes
router.delete('/admin/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/admin/events/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/admin/alerts/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/admin/marketplace/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Edit routes
router.put('/admin/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const { error } = await supabase.from('posts').update({ content }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.put('/admin/events/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time } = req.body;
  const { error } = await supabase.from('events').update({ title, description, date, time }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.put('/admin/alerts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, severity } = req.body;
  const { error } = await supabase.from('alerts').update({ title, description, severity }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.put('/admin/marketplace/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;
  const { error } = await supabase.from('marketplace_items').update({ title, description, price }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.put('/admin/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { error } = await supabase.from('provider_applications').update({ status }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
