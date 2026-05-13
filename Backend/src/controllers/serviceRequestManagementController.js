import { supabase } from '../supabaseClient.js';

/**
 * Service Request Management Controller
 * Handles service request operations with neighborhood context
 * Ensures service requests are properly linked to neighborhoods
 */

/**
 * Get service requests for a specific neighborhood
 * Used by admins to view all service activity in a neighborhood
 */
export async function getNeighborhoodServiceRequests(req, res) {
  try {
    const { neighborhoodId } = req.params;
    const { status, providerId } = req.query;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    // Get all service requests for services in this neighborhood
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        services!service_requests_service_id_fkey (
          id,
          title,
          category,
          neighborhood_id,
          provider_id
        ),
        users!service_requests_user_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        providers:services!service_requests_service_id_fkey(
          users!services_provider_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .eq('services.neighborhood_id', numericNeighborhoodId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('request_date', { ascending: false });

    if (error) throw error;

    const requests = (data || []).map((req) => ({
      id: req.id,
      userId: req.user_id,
      userName: req.users?.name || 'Unknown',
      userEmail: req.users?.email,
      serviceId: req.service_id,
      serviceTitle: req.services?.title || 'Unknown Service',
      category: req.services?.category || '',
      status: req.status,
      requestDate: req.request_date,
      scheduledDate: req.scheduled_date,
      description: req.description,
      neighborhoodId: req.services?.neighborhood_id,
      providerId: req.services?.provider_id,
    }));

    res.json({
      neighborhoodId: numericNeighborhoodId,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching neighborhood service requests:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get service request statistics for a neighborhood
 * Shows metrics about service requests and their statuses
 */
export async function getServiceRequestStats(req, res) {
  try {
    const { neighborhoodId } = req.params;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    // Get all service requests for this neighborhood
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        status,
        services!service_requests_service_id_fkey (
          category,
          neighborhood_id
        )
      `)
      .eq('services.neighborhood_id', numericNeighborhoodId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byStatus: {
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
      },
      byCategory: {},
      conversionRate: 0,
    };

    if (data && data.length > 0) {
      data.forEach((req) => {
        if (stats.byStatus.hasOwnProperty(req.status)) {
          stats.byStatus[req.status] += 1;
        }

        const category = req.services?.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      // Calculate conversion rate (accepted + completed / total)
      const successCount =
        (stats.byStatus.accepted || 0) + (stats.byStatus.completed || 0);
      stats.conversionRate = stats.total > 0 ? ((successCount / stats.total) * 100).toFixed(2) : 0;
    }

    res.json({
      neighborhoodId: numericNeighborhoodId,
      stats,
    });
  } catch (error) {
    console.error('Error fetching service request stats:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get pending service requests for a neighborhood
 * Useful for showing urgent items in admin dashboard
 */
export async function getPendingServiceRequests(req, res) {
  try {
    const { neighborhoodId } = req.params;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        services!service_requests_service_id_fkey (
          title,
          neighborhood_id
        ),
        users!service_requests_user_id_fkey (
          name,
          email
        )
      `)
      .eq('services.neighborhood_id', numericNeighborhoodId)
      .eq('status', 'pending')
      .order('request_date', { ascending: true });

    if (error) throw error;

    const requests = (data || []).map((req) => ({
      id: req.id,
      userId: req.user_id,
      userName: req.users?.name,
      userEmail: req.users?.email,
      serviceTitle: req.services?.title,
      requestDate: req.request_date,
      scheduledDate: req.scheduled_date,
      description: req.description,
    }));

    res.json({
      neighborhoodId: numericNeighborhoodId,
      pendingRequests: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching pending service requests:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get service request performance metrics by provider
 * Shows which providers are most responsive in the neighborhood
 */
export async function getProviderMetrics(req, res) {
  try {
    const { neighborhoodId } = req.params;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    // Get all service requests for this neighborhood grouped by provider
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        status,
        services!service_requests_service_id_fkey (
          provider_id,
          title,
          neighborhood_id,
          users!services_provider_id_fkey (
            name,
            avatar
          )
        )
      `)
      .eq('services.neighborhood_id', numericNeighborhoodId);

    if (error) throw error;

    const providerMetrics = {};

    if (data) {
      data.forEach((req) => {
        const providerId = req.services?.provider_id;
        const providerName = req.services?.users?.name || 'Unknown';

        if (!providerMetrics[providerId]) {
          providerMetrics[providerId] = {
            providerId,
            providerName,
            total: 0,
            accepted: 0,
            completed: 0,
            pending: 0,
            rejected: 0,
            responseRate: 0,
          };
        }

        providerMetrics[providerId].total += 1;
        if (req.status === 'accepted') providerMetrics[providerId].accepted += 1;
        else if (req.status === 'completed') providerMetrics[providerId].completed += 1;
        else if (req.status === 'pending') providerMetrics[providerId].pending += 1;
        else if (req.status === 'rejected') providerMetrics[providerId].rejected += 1;
      });

      // Calculate response rate (not pending / total)
      Object.values(providerMetrics).forEach((metrics) => {
        const responsed = metrics.total - metrics.pending;
        metrics.responseRate = metrics.total > 0 ? ((responsed / metrics.total) * 100).toFixed(2) : 0;
      });
    }

    res.json({
      neighborhoodId: numericNeighborhoodId,
      providers: Object.values(providerMetrics),
    });
  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    res.status(500).json({ error: error.message });
  }
}
