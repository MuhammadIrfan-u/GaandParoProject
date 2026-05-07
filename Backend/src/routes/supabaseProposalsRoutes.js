import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Transform snake_case from Supabase to camelCase for frontend
const transformProposal = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    proposerId: data.proposer_id,
    proposerName: data.proposer_name,
    name: data.name,
    city: data.city,
    state: data.state,
    description: data.description,
    primaryLandmark: data.primary_landmark,
    status: data.status,
    submittedDate: data.submitted_date,
    reviewedDate: data.reviewed_date,
    reviewNotes: data.review_notes,
    adminId: data.admin_id,
  };
};

// Get all proposals (restricted - only for admin use)
// Note: This endpoint should ideally require admin authentication
router.get('/proposals', async (req, res) => {
  try {
    const userId = req.query.userId;
    const status = req.query.status;
    
    let query = supabase
      .from('neighborhood_proposals')
      .select('*')
      .order('submitted_date', { ascending: false });

    // If userId is provided, filter by it (for regular users viewing their own)
    // If not provided, it's likely an admin view (returning all)
    if (userId) {
      console.log(`Fetching proposals for user: ${userId}`);
      query = query.eq('proposer_id', userId);
    } else {
      console.log('Fetching all proposals (Admin view)');
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const transformedData = (data || []).map(transformProposal);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific proposal (with security check)
router.get('/proposals/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required for proposal viewing' });
    }

    const { data, error } = await supabase
      .from('neighborhood_proposals')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Security check: only allow viewing own proposals
    if (data.proposer_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own proposals' });
    }

    const transformedData = transformProposal(data);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create proposal
router.post('/proposals', async (req, res) => {
  try {
    const {
      proposerId,
      proposerName,
      name,
      city,
      state,
      description,
      primaryLandmark,
    } = req.body;
    
    if (
      !proposerId ||
      !proposerName ||
      !name ||
      !city ||
      !state ||
      !description ||
      !primaryLandmark
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('neighborhood_proposals')
      .insert([{
        proposer_id: proposerId,
        proposer_name: proposerName,
        name,
        city,
        state,
        description,
        primary_landmark: primaryLandmark,
        status: 'pending',
        submitted_date: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const transformedData = transformProposal(data);
    res.status(201).json(transformedData);
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
});

// Update proposal status (admin only)
router.put('/proposals/:id/status', async (req, res) => {
  try {
    const { status, reviewNotes, adminId } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const { data, error } = await supabase
      .from('neighborhood_proposals')
      .update({
        status,
        review_notes: reviewNotes || null,
        reviewed_date: new Date().toISOString(),
        admin_id: adminId,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If approved, create neighborhood
    if (status === 'approved') {
      const proposal = data;
      const { data: newNeighborhood, error: createError } = await supabase
        .from('neighborhoods')
        .insert([{
          name: proposal.name,
          city: proposal.city,
          state: proposal.state,
          description: proposal.description,
          population: 1,
          primary_landmark: proposal.primary_landmark,
          admin_id: proposal.proposer_id,
          verified: true,
          created_date: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating neighborhood from approved proposal:', createError);
      } else {
        console.log(`✓ Neighborhood created: "${proposal.name}", Admin: ${proposal.proposer_id}`);
        
        // Also create default settings for the neighborhood
        const { error: settingsError } = await supabase
          .from('neighborhood_settings')
          .insert([{
            neighborhood_id: newNeighborhood.id,
            enable_marketplace: true,
            enable_resource_exchange: true,
            enable_public_alerts: true,
            enable_events: true,
            enable_services: true,
            require_verification: false,
          }]);
        
        if (settingsError) {
          console.error('Error creating neighborhood settings:', settingsError);
        } else {
          console.log(`✓ Neighborhood settings initialized for: "${proposal.name}"`);
        }
      }
    }
    
    const transformedData = transformProposal(data);
    res.json(transformedData);
  } catch (error) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
});

// Get proposals by user
router.get('/proposals/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('neighborhood_proposals')
      .select('*')
      .eq('proposer_id', req.params.userId)
      .order('submitted_date', { ascending: false });
    
    if (error) throw error;
    
    const transformedData = (data || []).map(transformProposal);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching user proposals:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
