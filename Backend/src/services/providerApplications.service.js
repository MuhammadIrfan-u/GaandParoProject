import { supabase } from '../supabaseClient.js';

/**
 * Business logic layer for provider applications
 * Handles core operations for managing provider approvals per neighborhood
 */

/**
 * Check if a user is an approved provider in a specific neighborhood
 * @param {number} userId - The user ID to check
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<boolean>} True if user is approved provider in neighborhood
 */
export async function isApprovedProvider(userId, neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .eq('status', 'approved')
      .single();

    if (error && error.code === 'PGRST116') {
      // No row found - user is not approved
      return false;
    }

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking approved provider status:', error);
    throw error;
  }
}

/**
 * Get application statistics for a neighborhood
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<Object>} Object with pending, approved, rejected, and total counts
 */
export async function getApplicationStats(neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('status')
      .eq('neighborhood_id', neighborhoodId);

    if (error) throw error;

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: data?.length || 0,
    };

    if (data) {
      data.forEach((app) => {
        if (app.status === 'pending') stats.pending += 1;
        else if (app.status === 'approved') stats.approved += 1;
        else if (app.status === 'rejected') stats.rejected += 1;
      });
    }

    return stats;
  } catch (error) {
    console.error('Error fetching application stats:', error);
    throw error;
  }
}

/**
 * Get all applications for a neighborhood by status
 * @param {number} neighborhoodId - The neighborhood ID
 * @param {string} status - Status filter: 'pending', 'approved', or 'rejected' (optional)
 * @returns {Promise<Array>} Array of applications
 */
export async function getApplicationsByStatus(neighborhoodId, status = null) {
  try {
    let query = supabase
      .from('provider_applications')
      .select('*, users(id, name, email, avatar, verified)')
      .eq('neighborhood_id', neighborhoodId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching applications by status:', error);
    throw error;
  }
}

/**
 * Get a specific application
 * @param {number} applicationId - The application ID
 * @param {number} neighborhoodId - The neighborhood ID (for security)
 * @returns {Promise<Object|null>} Application object or null if not found
 */
export async function getApplicationById(applicationId, neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*, users(id, name, email, avatar, verified, phone)')
      .eq('id', applicationId)
      .eq('neighborhood_id', neighborhoodId)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    throw error;
  }
}

/**
 * Get user's application for a specific neighborhood
 * @param {number} userId - The user ID
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<Object|null>} Application object or null if no application
 */
export async function getUserApplicationForNeighborhood(userId, neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*')
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user application for neighborhood:', error);
    throw error;
  }
}

/**
 * Count pending applications for a neighborhood
 * Useful for dashboard badge notifications
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<number>} Count of pending applications
 */
export async function countPendingApplications(neighborhoodId) {
  try {
    const { count, error } = await supabase
      .from('provider_applications')
      .select('id', { count: 'exact' })
      .eq('neighborhood_id', neighborhoodId)
      .eq('status', 'pending');

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error counting pending applications:', error);
    throw error;
  }
}

/**
 * Get all rejected applications for a neighborhood
 * Useful for viewing rejection history
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<Array>} Array of rejected applications
 */
export async function getRejectedApplications(neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*, users(id, name, email, avatar)')
      .eq('neighborhood_id', neighborhoodId)
      .eq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching rejected applications:', error);
    throw error;
  }
}

/**
 * Get approved providers for a neighborhood
 * Useful for viewing active providers and their details
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<Array>} Array of approved provider applications
 */
export async function getApprovedProviders(neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*, users(id, name, email, avatar, verified, phone)')
      .eq('neighborhood_id', neighborhoodId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching approved providers:', error);
    throw error;
  }
}

/**
 * Get user's application history across all neighborhoods
 * Useful for provider profile/dashboard
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} Array of applications in all neighborhoods
 */
export async function getUserApplicationHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('*, neighborhoods(id, name, city, state)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user application history:', error);
    throw error;
  }
}

/**
 * Get category distribution for applications in a neighborhood
 * Useful for understanding which service categories are in demand
 * @param {number} neighborhoodId - The neighborhood ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of categories with counts
 */
export async function getCategoryDistribution(neighborhoodId, status = null) {
  try {
    let query = supabase
      .from('provider_applications')
      .select('category')
      .eq('neighborhood_id', neighborhoodId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category and count
    const distribution = {};
    if (data) {
      data.forEach((app) => {
        const cat = app.category || 'Uncategorized';
        distribution[cat] = (distribution[cat] || 0) + 1;
      });
    }

    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count,
    }));
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    throw error;
  }
}

/**
 * Get application metrics for a neighborhood
 * Comprehensive analytics for admin dashboard
 * @param {number} neighborhoodId - The neighborhood ID
 * @returns {Promise<Object>} Metrics object with various statistics
 */
export async function getApplicationMetrics(neighborhoodId) {
  try {
    const { data, error } = await supabase
      .from('provider_applications')
      .select('status, category, created_at')
      .eq('neighborhood_id', neighborhoodId);

    if (error) throw error;

    const metrics = {
      total: data?.length || 0,
      byStatus: { pending: 0, approved: 0, rejected: 0 },
      byCategory: {},
      averageApprovalTime: 0,
      weeklyTrend: {},
    };

    if (data && data.length > 0) {
      // Count by status
      data.forEach((app) => {
        metrics.byStatus[app.status] = (metrics.byStatus[app.status] || 0) + 1;
        metrics.byCategory[app.category] = (metrics.byCategory[app.category] || 0) + 1;
      });

      // Calculate weekly trend
      const now = new Date();
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekKey = `Week of ${weekStart.toLocaleDateString()}`;
        const count = data.filter((app) => {
          const appDate = new Date(app.created_at);
          return appDate >= weekStart && appDate < weekEnd;
        }).length;
        metrics.weeklyTrend[weekKey] = count;
      }
    }

    return metrics;
  } catch (error) {
    console.error('Error fetching application metrics:', error);
    throw error;
  }
}
