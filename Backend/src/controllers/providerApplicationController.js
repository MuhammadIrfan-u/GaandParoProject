import { supabase } from '../supabaseClient.js';
import * as providerApplicationsService from '../services/providerApplications.service.js';

/**
 * Get all pending provider applications for a specific neighborhood
 * Used by neighborhood admins to review applications
 */
export async function getApplicationsByNeighborhood(req, res) {
  try {
    const { neighborhoodId } = req.params;
    const { status } = req.query;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    let query = supabase
      .from('provider_applications')
      .select('*, users(id, name, email, avatar, verified, phone)')
      .eq('neighborhood_id', numericNeighborhoodId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data
    const applications = (data || []).map((app) => ({
      id: app.id,
      userId: app.user_id,
      userName: app.users?.name || 'Unknown',
      userEmail: app.users?.email || '',
      userAvatar: app.users?.avatar || 'U',
      userVerified: app.users?.verified || false,
      userPhone: app.users?.phone || '',
      category: app.category,
      experience: app.experience,
      description: app.description,
      status: app.status || 'pending',
      neighborhoodId: app.neighborhood_id,
      submittedDate: app.created_at,
    }));

    res.json(applications);
  } catch (error) {
    console.error('Error fetching provider applications:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get statistics for provider applications in a neighborhood
 * Returns counts by status for dashboard analytics
 */
export async function getApplicationsStats(req, res) {
  try {
    const { neighborhoodId } = req.params;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    const stats = await providerApplicationsService.getApplicationStats(numericNeighborhoodId);

    res.json({
      neighborhoodId: numericNeighborhoodId,
      pending: stats.pending,
      approved: stats.approved,
      rejected: stats.rejected,
      total: stats.total,
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Approve a provider application
 * Only callable by neighborhood admin
 * Updates status to 'approved' and creates notification
 */
export async function approveApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const { neighborhoodId } = req.body;

    if (!applicationId || !neighborhoodId) {
      return res.status(400).json({
        error: 'Application ID and Neighborhood ID are required',
      });
    }

    const numericAppId = parseInt(String(applicationId).replace(/\D/g, ''), 10);
    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);

    if (isNaN(numericAppId) || isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid application or neighborhood ID' });
    }

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from('provider_applications')
      .select('*')
      .eq('id', numericAppId)
      .eq('neighborhood_id', numericNeighborhoodId)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found in this neighborhood' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ error: 'Application is already approved' });
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('provider_applications')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', numericAppId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification for the user
    await supabase.from('notifications').insert([
      {
        user_id: application.user_id,
        type: 'provider_approved',
        title: 'Provider Application Approved',
        message: `Your provider application has been approved! You can now offer services in this neighborhood.`,
        neighborhood_id: numericNeighborhoodId,
      },
    ]);

    res.json({
      success: true,
      message: 'Application approved',
      application: {
        id: updatedApp.id,
        userId: updatedApp.user_id,
        status: updatedApp.status,
        neighborhoodId: updatedApp.neighborhood_id,
      },
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reject a provider application
 * Only callable by neighborhood admin
 * Updates status to 'rejected' with reason and creates notification
 */
export async function rejectApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const { neighborhoodId, reason } = req.body;

    if (!applicationId || !neighborhoodId) {
      return res.status(400).json({
        error: 'Application ID and Neighborhood ID are required',
      });
    }

    const numericAppId = parseInt(String(applicationId).replace(/\D/g, ''), 10);
    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);

    if (isNaN(numericAppId) || isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid application or neighborhood ID' });
    }

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from('provider_applications')
      .select('*')
      .eq('id', numericAppId)
      .eq('neighborhood_id', numericNeighborhoodId)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found in this neighborhood' });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({ error: 'Application is already rejected' });
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('provider_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', numericAppId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification for the user
    await supabase.from('notifications').insert([
      {
        user_id: application.user_id,
        type: 'provider_rejected',
        title: 'Provider Application Rejected',
        message: `Your provider application has been rejected. Reason: ${reason || 'No reason provided'}`,
        neighborhood_id: numericNeighborhoodId,
      },
    ]);

    res.json({
      success: true,
      message: 'Application rejected',
      application: {
        id: updatedApp.id,
        userId: updatedApp.user_id,
        status: updatedApp.status,
        rejectionReason: updatedApp.rejection_reason,
        neighborhoodId: updatedApp.neighborhood_id,
      },
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check if a user is an approved provider in a specific neighborhood
 * Used to gate service creation and editing
 */
export async function isApprovedProviderInNeighborhood(req, res) {
  try {
    const { userId, neighborhoodId } = req.params;

    if (!userId || !neighborhoodId) {
      return res.status(400).json({
        error: 'User ID and Neighborhood ID are required',
      });
    }

    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);
    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);

    if (isNaN(numericUserId) || isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid user or neighborhood ID' });
    }

    const isApproved = await providerApplicationsService.isApprovedProvider(
      numericUserId,
      numericNeighborhoodId
    );

    res.json({
      userId: numericUserId,
      neighborhoodId: numericNeighborhoodId,
      isApprovedProvider: isApproved,
    });
  } catch (error) {
    console.error('Error checking provider status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get user's application status in a specific neighborhood
 * Returns null if no application, or the application details if exists
 */
export async function getUserApplicationStatus(req, res) {
  try {
    const { userId, neighborhoodId } = req.params;

    if (!userId || !neighborhoodId) {
      return res.status(400).json({
        error: 'User ID and Neighborhood ID are required',
      });
    }

    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);
    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);

    if (isNaN(numericUserId) || isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid user or neighborhood ID' });
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .select('*')
      .eq('user_id', numericUserId)
      .eq('neighborhood_id', numericNeighborhoodId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no row found, which is okay
      throw error;
    }

    res.json({
      userId: numericUserId,
      neighborhoodId: numericNeighborhoodId,
      application: data
        ? {
            id: data.id,
            status: data.status,
            category: data.category,
            experience: data.experience,
            submittedDate: data.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching user application status:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all neighborhoods where a user is an approved provider
 * Useful for provider dashboard to show their active neighborhoods
 */
export async function getUserApprovedNeighborhoods(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const numericUserId = parseInt(String(userId).replace(/\D/g, ''), 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .select('*, neighborhoods(id, name, city, state)')
      .eq('user_id', numericUserId)
      .eq('status', 'approved');

    if (error) throw error;

    const neighborhoods = (data || []).map((app) => ({
      neighborhoodId: app.neighborhood_id,
      neighborhoodName: app.neighborhoods?.name || '',
      city: app.neighborhoods?.city || '',
      state: app.neighborhoods?.state || '',
      approvedDate: app.created_at,
    }));

    res.json({
      userId: numericUserId,
      approvedNeighborhoods: neighborhoods,
      count: neighborhoods.length,
    });
  } catch (error) {
    console.error('Error fetching user approved neighborhoods:', error);
    res.status(500).json({ error: error.message });
  }
}
