import { supabase } from '../supabaseClient.js';

/**
 * Service Management Controller
 * Handles service-specific operations like toggling availability status
 * and other neighborhood-linked service management
 */

/**
 * Toggle or set service availability status
 * A service with availability=false is disabled and won't appear in listings
 * Only the provider or neighborhood admin can disable a service
 */
export async function toggleServiceAvailability(req, res) {
  try {
    const { serviceId } = req.params;
    const { available } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    if (typeof available !== 'boolean') {
      return res.status(400).json({ error: 'Available status must be a boolean' });
    }

    const numericServiceId = parseInt(String(serviceId).replace(/\D/g, ''), 10);
    if (isNaN(numericServiceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const { data, error } = await supabase
      .from('services')
      .update({
        availability: available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', numericServiceId)
      .select('*, users(id, name, avatar, verified)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Service ${available ? 'enabled' : 'disabled'}`,
      service: {
        id: data.id,
        title: data.title,
        availability: data.availability,
        neighborhoodId: data.neighborhood_id,
      },
    });
  } catch (error) {
    console.error('Error toggling service availability:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get services for a neighborhood with detailed information
 * Includes filtering for available/disabled status
 * Used by admin dashboard to manage services
 */
export async function getNeighborhoodServices(req, res) {
  try {
    const { neighborhoodId } = req.params;
    const { showDisabled } = req.query;

    if (!neighborhoodId) {
      return res.status(400).json({ error: 'Neighborhood ID is required' });
    }

    const numericNeighborhoodId = parseInt(String(neighborhoodId).replace(/\D/g, ''), 10);
    if (isNaN(numericNeighborhoodId)) {
      return res.status(400).json({ error: 'Invalid neighborhood ID' });
    }

    let query = supabase
      .from('services')
      .select('*, users(id, name, avatar, verified, email)')
      .eq('neighborhood_id', numericNeighborhoodId)
      .order('created_at', { ascending: false });

    // Filter by availability if not showing disabled
    if (showDisabled !== 'true') {
      query = query.eq('availability', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    const services = (data || []).map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price,
      provider: service.users?.name || 'Unknown',
      providerId: service.provider_id,
      providerEmail: service.users?.email,
      providerVerified: service.users?.verified || false,
      rating: service.rating || 5.0,
      reviewCount: service.review_count || 0,
      available: service.availability,
      status: service.moderation_status,
      neighborhoodId: service.neighborhood_id,
      flagged: service.is_flagged,
    }));

    res.json({
      neighborhoodId: numericNeighborhoodId,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('Error fetching neighborhood services:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get service statistics for a neighborhood
 * Shows metrics about services in the neighborhood
 */
export async function getServiceStats(req, res) {
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
      .from('services')
      .select('category, availability, is_flagged, rating')
      .eq('neighborhood_id', numericNeighborhoodId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      available: 0,
      disabled: 0,
      flagged: 0,
      byCategory: {},
      averageRating: 0,
    };

    if (data && data.length > 0) {
      let totalRating = 0;
      let ratingCount = 0;

      data.forEach((service) => {
        if (service.availability) stats.available += 1;
        else stats.disabled += 1;

        if (service.is_flagged) stats.flagged += 1;

        const category = service.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        if (service.rating) {
          totalRating += service.rating;
          ratingCount += 1;
        }
      });

      stats.averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;
    }

    res.json({
      neighborhoodId: numericNeighborhoodId,
      stats,
    });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get disabled services for a neighborhood
 * Useful for admin to see which services are currently disabled
 */
export async function getDisabledServices(req, res) {
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
      .from('services')
      .select('*, users(id, name, avatar, email)')
      .eq('neighborhood_id', numericNeighborhoodId)
      .eq('availability', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const services = (data || []).map((service) => ({
      id: service.id,
      title: service.title,
      provider: service.users?.name,
      providerId: service.provider_id,
      category: service.category,
      disabledAt: service.updated_at,
    }));

    res.json({
      neighborhoodId: numericNeighborhoodId,
      disabledServices: services,
      count: services.length,
    });
  } catch (error) {
    console.error('Error fetching disabled services:', error);
    res.status(500).json({ error: error.message });
  }
}
