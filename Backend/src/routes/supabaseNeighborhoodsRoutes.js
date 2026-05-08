import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Transform neighborhood data from snake_case to camelCase
const transformNeighborhood = (data) => ({
  id: data.id,
  name: data.name,
  city: data.city,
  state: data.state,
  description: data.description,
  population: data.population,
  primaryLandmark: data.primary_landmark,
  adminId: data.admin_id,
  leadId: data.admin_id, // Mapping admin_id to leadId for frontend compatibility
  leadName: data.lead_name || 'System Admin', // Include lead name
  verified: data.verified,
  createdDate: data.created_date,
  coverPhoto: data.cover_photo,
  logo: data.logo,
  guidelines: data.guidelines,
  settings: data.settings,
});

/**
 * Reverse geocode coordinates using Nominatim (free, no API key needed)
 * Returns { city, state, suburb, county, displayName } from the coordinates
 */
async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            {
                headers: {
                    'User-Agent': 'VNC-App/1.0',
                    'Accept-Language': 'en',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim API returned ${response.status}`);
        }

        const data = await response.json();
        const address = data.address || {};

        // Build a rich location object — Nominatim hierarchy varies by country
        const city = address.city || address.town || address.village || address.municipality || '';
        const suburb = address.suburb || address.neighbourhood || address.quarter || '';
        const county = address.county || address.district || '';
        const state = address.state || '';
        const country = address.country || '';

        return {
            city: city.trim(),
            suburb: suburb.trim(),
            county: county.trim(),
            state: state.trim(),
            country: country.trim(),
            displayName: data.display_name || '',
            // All location tokens for flexible matching
            allTokens: [city, suburb, county, state, country]
                .filter(Boolean)
                .map(s => s.toLowerCase().trim()),
        };
    } catch (error) {
        console.error('Nominatim reverse geocoding error:', error.message);
        throw new Error('Failed to retrieve location information');
    }
}

/**
 * Smart location match.
 */
function locationsMatch(geolocation, neighborhoodCity, neighborhoodState) {
    if (!neighborhoodCity) return false;

    const nbCity = neighborhoodCity.toLowerCase().trim();
    const nbState = (neighborhoodState || '').toLowerCase().trim();
    const display = geolocation.displayName.toLowerCase();

    // Build full set of tokens from geocoded result
    const tokens = geolocation.allTokens; // already lowercased

    // 1. Exact city match
    if (geolocation.city.toLowerCase() === nbCity) return true;

    // 2. Any geocoded token exactly equals neighbourhood city
    if (tokens.some(t => t === nbCity)) return true;

    // 3. Any geocoded token CONTAINS the neighbourhood city as a word
    if (tokens.some(t => t.includes(nbCity))) return true;

    // 4. Neighbourhood city appears in the full Nominatim display name
    if (display.includes(nbCity)) return true;

    // 5. Handle state abbreviations
    const stateAbbreviations = {
        'is': 'islamabad',
        'pb': 'punjab',
        'kpk': 'khyber pakhtunkhwa',
        'sd': 'sindh',
        'bl': 'balochistan',
        'gb': 'gilgit baltistan',
        'ajk': 'azad kashmir',
    };
    const expandedState = stateAbbreviations[nbState] || nbState;
    if (expandedState && (display.includes(expandedState) || tokens.some(t => t.includes(expandedState)))) {
        if (!geolocation.city) return true;
    }

    return false;
}

/**
 * Sets users.verified = true when both document + location are verified
 */
async function checkAndSetUserVerified(userId) {
    try {
        const userIdStr = String(userId);

        const { data: docApproval } = await supabase
            .from('verification_requests')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .limit(1)
            .maybeSingle();

        const { data: locVerified } = await supabase
            .from('neighborhood_members')
            .select('id')
            .eq('user_id', userIdStr)
            .eq('status', 'verified')
            .limit(1)
            .maybeSingle();

        const bothVerified = !!docApproval && !!locVerified;

        if (bothVerified) {
            await supabase
                .from('users')
                .update({ verified: true })
                .eq('id', userId);
        }
    } catch (err) {
        console.error('[VERIFIED CHECK] error:', err.message);
    }
}

// Get all neighborhoods
router.get('/neighborhoods', async (req, res) => {
  try {
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from('neighborhoods')
      .select('*');
    
    if (neighborhoodsError) throw neighborhoodsError;
    
    // Fetch settings and lead name for each neighborhood
    const enrichedData = await Promise.all(
      (neighborhoods || []).map(async (n) => {
        // Fetch settings
        const { data: settings } = await supabase
          .from('neighborhood_settings')
          .select('*')
          .eq('neighborhood_id', n.id)
          .single();
        
        // Fetch lead name from users table
        let leadName = 'System Admin';
        if (n.admin_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', n.admin_id)
            .single();
          
          if (userData) leadName = userData.name;
        }
        
        return {
          ...n,
          lead_name: leadName,
          settings: settings ? {
            enableMarketplace: settings.enable_marketplace ?? true,
            enableResourceExchange: settings.enable_resource_exchange ?? true,
            enablePublicAlerts: settings.enable_public_alerts ?? true,
            enableEvents: settings.enable_events ?? true,
            enableServices: settings.enable_services ?? true,
            require_verification: settings.require_verification ?? false,
          } : { 
            enableMarketplace: true, 
            enableResourceExchange: true,
            enablePublicAlerts: true,
            enableEvents: true,
            enableServices: true,
            require_verification: false,
          },
        };
      })
    );
    
    const transformedData = enrichedData.map(transformNeighborhood);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific neighborhood
router.get('/neighborhoods/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Neighborhood not found' });
    }
    
    // Fetch settings and lead name
    const { data: settings } = await supabase
      .from('neighborhood_settings')
      .select('*')
      .eq('neighborhood_id', data.id)
      .single();
    
    // Fetch lead name
    let leadName = 'System Admin';
    if (data.admin_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', data.admin_id)
        .single();
      
      if (userData) leadName = userData.name;
    }

    const enrichedData = {
      ...data,
      lead_name: leadName,
      settings: settings ? {
        enableMarketplace: settings.enable_marketplace ?? true,
        enableResourceExchange: settings.enable_resource_exchange ?? true,
        enablePublicAlerts: settings.enable_public_alerts ?? true,
        enableEvents: settings.enable_events ?? true,
        enableServices: settings.enable_services ?? true,
        require_verification: settings.require_verification ?? false,
      } : { 
        enableMarketplace: true, 
        enableResourceExchange: true,
        enablePublicAlerts: true,
        enableEvents: true,
        enableServices: true,
        require_verification: false,
      },
    };
    
    const transformedData = transformNeighborhood(enrichedData);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user's neighborhood
router.get('/neighborhoods/current', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('admin_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    const transformedData = data ? transformNeighborhood(data) : null;
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching current neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create neighborhood (admin only)
router.post('/neighborhoods', async (req, res) => {
  try {
    const { name, city, state, description, population, primaryLandmark, adminId, verified } = req.body;
    
    if (!name || !city || !state || !description || !adminId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert([{
        name,
        city,
        state,
        description,
        population: population || 0,
        primary_landmark: primaryLandmark,
        admin_id: adminId,
        verified: verified || false,
        created_date: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Create default settings for the neighborhood
    const { error: settingsError } = await supabase
      .from('neighborhood_settings')
      .insert([{
        neighborhood_id: data.id,
        enable_marketplace: true,
        enable_resource_exchange: true,
      }])
      .select()
      .single();
    
    if (settingsError) {
      console.error('Warning: Could not create default settings:', settingsError);
      // Continue anyway - settings are optional
    }
    
    // Fetch the newly created neighborhood with settings
    const { data: neighborhoodWithSettings } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', data.id)
      .single();
    
    const enrichedData = {
      ...neighborhoodWithSettings,
      settings: {
        enableMarketplace: true,
        enableResourceExchange: true,
      },
    };
    
    const transformedData = transformNeighborhood(enrichedData);
    res.status(201).json(transformedData);
  } catch (error) {
    console.error('Error creating neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update neighborhood settings
router.put('/neighborhoods/:id/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'Settings required' });
    }
    
    const { data, error } = await supabase
      .from('neighborhood_settings')
      .update(settings)
      .eq('neighborhood_id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update neighborhood guidelines
router.put('/neighborhoods/:id/guidelines', async (req, res) => {
  try {
    const { guidelines } = req.body;
    
    if (guidelines === undefined) {
      return res.status(400).json({ error: 'Guidelines required' });
    }
    
    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('neighborhood_settings')
      .upsert(
        {
          neighborhood_id: parseInt(req.params.id),
          guidelines,
        },
        { onConflict: 'neighborhood_id' }
      )
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating guidelines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update neighborhood branding
router.put('/neighborhoods/:id/branding', async (req, res) => {
  try {
    const { coverPhoto, logo } = req.body;
    
    if (!coverPhoto && !logo) {
      return res.status(400).json({ error: 'At least one branding element required' });
    }
    
    const updateData = {};
    if (coverPhoto) updateData.cover_photo = coverPhoto;
    if (logo) updateData.logo = logo;
    
    const { data, error } = await supabase
      .from('neighborhoods')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch settings for the neighborhood
    const { data: settings } = await supabase
      .from('neighborhood_settings')
      .select('*')
      .eq('neighborhood_id', data.id)
      .single();
    
    const enrichedData = {
      ...data,
      settings: settings ? {
        enableMarketplace: settings.enable_marketplace ?? true,
        enableResourceExchange: settings.enable_resource_exchange ?? true,
        enablePublicAlerts: settings.enable_public_alerts ?? true,
        enableEvents: settings.enable_events ?? true,
        enableServices: settings.enable_services ?? true,
        requireVerification: settings.require_verification ?? false,
      } : { 
        enableMarketplace: true, 
        enableResourceExchange: true,
        enablePublicAlerts: true,
        enableEvents: true,
        enableServices: true,
        requireVerification: false,
      },
    };

    // Return the full neighborhood data
    const transformedData = transformNeighborhood(enrichedData);
    res.json(transformedData);
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete neighborhood (admin only)
router.delete('/neighborhoods/:id', async (req, res) => {
  try {
    const neighborhoodId = parseInt(req.params.id);

    // Delete dependent records first to avoid foreign key constraint errors
    try {
      const { error: membersError } = await supabase
        .from('neighborhood_members')
        .delete()
        .eq('neighborhood_id', neighborhoodId);
      if (membersError) console.warn('Warning deleting members for neighborhood:', membersError);
    } catch (e) {
      console.warn('Error deleting neighborhood members:', e);
    }

    try {
      const { error: settingsError } = await supabase
        .from('neighborhood_settings')
        .delete()
        .eq('neighborhood_id', neighborhoodId);
      if (settingsError) console.warn('Warning deleting settings for neighborhood:', settingsError);
    } catch (e) {
      console.warn('Error deleting neighborhood settings:', e);
    }

    try {
      const { error: proposalsError } = await supabase
        .from('neighborhood_proposals')
        .delete()
        .eq('neighborhood_id', neighborhoodId);
      if (proposalsError) console.warn('Warning deleting proposals for neighborhood:', proposalsError);
    } catch (e) {
      console.warn('Error deleting neighborhood proposals:', e);
    }

    const { error } = await supabase
      .from('neighborhoods')
      .delete()
      .eq('id', neighborhoodId);

    if (error) throw error;

    res.json({ message: 'Neighborhood deleted successfully' });
  } catch (error) {
    console.error('Error deleting neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new route to update hub settings
router.put('/neighborhoods/:id/hub-settings', async (req, res) => {
  try {
    const { 
      enable_marketplace, 
      enable_resource_exchange,
      enable_public_alerts,
      enable_events,
      enable_services,
      require_verification
    } = req.body;

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('neighborhood_settings')
      .upsert(
        {
          neighborhood_id: parseInt(req.params.id),
          enable_marketplace: enable_marketplace ?? true,
          enable_resource_exchange: enable_resource_exchange ?? true,
          enable_public_alerts: enable_public_alerts ?? true,
          enable_events: enable_events ?? true,
          enable_services: enable_services ?? true,
          require_verification: require_verification ?? false,
        },
        { onConflict: 'neighborhood_id' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating hub settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join a neighborhood (with location verification)
router.post('/neighborhoods/:id/join', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    const neighborhoodId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[JOIN] User ${userId} attempting to join neighborhood ${neighborhoodId}`);

    // If coordinates are provided, perform advanced verification
    if (latitude !== undefined && longitude !== undefined) {
      // Fetch neighborhood data for location comparison
      const { data: neighborhood, error: neighError } = await supabase
        .from('neighborhoods')
        .select('id, name, city, state')
        .eq('id', neighborhoodId)
        .single();

      if (neighError || !neighborhood) {
        return res.status(404).json({ error: 'Neighborhood not found' });
      }

      // 1. Check if already a member elsewhere
      const { data: existingMembership } = await supabase
        .from('neighborhood_members')
        .select('neighborhood_id')
        .eq('user_id', userId);

      if (existingMembership && existingMembership.length > 0) {
        const currentNbhId = existingMembership[0].neighborhood_id;
        if (String(currentNbhId) !== String(neighborhoodId)) {
          return res.status(400).json({
            error: 'User is already a member of another neighborhood. Please leave that neighborhood first.',
            code: 'ALREADY_MEMBER_ELSEWHERE',
            currentNeighborhoodId: currentNbhId
          });
        }
      }

      // 2. Reverse geocode browser location
      const geolocation = await reverseGeocode(latitude, longitude);

      // 3. Smart location match
      const locationMatches = locationsMatch(geolocation, neighborhood.city, neighborhood.state);

      if (!locationMatches) {
        return res.status(403).json({
          success: false,
          matched: false,
          code: 'LOCATION_MISMATCH',
          message: `Your location does not match ${neighborhood.name}. You must be physically located in ${neighborhood.city} to join.`,
          neighborhoodLocation: { city: neighborhood.city, state: neighborhood.state },
          userLocation: {
            city: geolocation.city || geolocation.suburb || geolocation.county,
            state: geolocation.state,
            displayName: geolocation.displayName,
          },
        });
      }

      // 4. Location matched -> join as verified
      const { data, error } = await supabase
        .from('neighborhood_members')
        .upsert({
          user_id: userId,
          neighborhood_id: neighborhoodId,
          joined_date: new Date().toISOString(),
          status: 'verified',
          verified_at: new Date().toISOString(),
          user_location_city: geolocation.city || geolocation.suburb || geolocation.county,
          user_location_state: geolocation.state,
        }, { onConflict: 'user_id, neighborhood_id' })
        .select()
        .single();

      if (error) throw error;

      // Update member count
      const { data: nbh } = await supabase.from('neighborhoods').select('member_count').eq('id', neighborhoodId).single();
      const newCount = (nbh?.member_count || 0) + 1;
      await supabase.from('neighborhoods').update({ member_count: newCount }).eq('id', neighborhoodId);

      // Check for full user verification
      await checkAndSetUserVerified(userId);

      return res.json({
        success: true,
        matched: true,
        status: 'verified',
        message: `Welcome to ${neighborhood.name}!`,
        userLocation: {
          city: geolocation.city || geolocation.suburb || geolocation.county,
          state: geolocation.state,
          displayName: geolocation.displayName,
        }
      });
    }

    // Fallback: simple join without location coordinates
    // (Still check for membership conflict)
    const { data: existing } = await supabase.from('neighborhood_members').select('id').eq('user_id', userId);
    if (existing && existing.length > 0) {
       return res.status(400).json({ error: 'Already a member of a neighborhood' });
    }

    const { data, error } = await supabase
      .from('neighborhood_members')
      .insert({
        user_id: userId,
        neighborhood_id: neighborhoodId,
        joined_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Successfully joined neighborhood', membershipId: data.id });
  } catch (error) {
    console.error('Error joining neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leave a neighborhood
router.post('/neighborhoods/:id/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const neighborhoodId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[POST] User ${userId} attempting to leave neighborhood ${neighborhoodId}`);

    // Remove user from the neighborhood
    const { error } = await supabase
      .from('neighborhood_members')
      .delete()
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    // Update member count
    const { data: neighborhood, error: countError } = await supabase
      .from('neighborhoods')
      .select('member_count')
      .eq('id', neighborhoodId)
      .single();

    if (countError) {
      console.error('Count fetch error:', countError);
    }

    const newCount = Math.max(0, (neighborhood?.member_count || 1) - 1);
    await supabase
      .from('neighborhoods')
      .update({ member_count: newCount })
      .eq('id', neighborhoodId);

    console.log(`User ${userId} successfully left neighborhood ${neighborhoodId}`);

    res.json({ message: 'Successfully left neighborhood' });
  } catch (error) {
    console.error('Error leaving neighborhood:', error);
    console.error('Error details:', error.message, error.code);
    res.status(500).json({ error: error.message, details: error.code });
  }
});

// Leave a neighborhood (DELETE method for REST compatibility)
router.delete('/neighborhoods/:id/leave', async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;
    const neighborhoodId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[DELETE] User ${userId} attempting to leave neighborhood ${neighborhoodId}`);

    // Remove user from the neighborhood
    const { error } = await supabase
      .from('neighborhood_members')
      .delete()
      .eq('user_id', userId)
      .eq('neighborhood_id', neighborhoodId);

    if (error) throw error;

    // Update member count
    const { data: neighborhood } = await supabase
      .from('neighborhoods')
      .select('member_count')
      .eq('id', neighborhoodId)
      .single();

    const newCount = Math.max(0, (neighborhood?.member_count || 1) - 1);
    await supabase
      .from('neighborhoods')
      .update({ member_count: newCount })
      .eq('id', neighborhoodId);

    res.json({ success: true, message: 'Successfully left neighborhood' });
  } catch (error) {
    console.error('Error leaving neighborhood:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leave current neighborhood (Generic POST)
router.post('/neighborhoods/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    console.log(`[POST GENERIC] User ${userId} leaving their current neighborhood`);

    const { error } = await supabase
      .from('neighborhood_members')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Successfully left neighborhood' });
  } catch (error) {
    console.error('Error in generic leave:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's current neighborhood
router.get('/users/:userId/neighborhood', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Fetching neighborhood for user ${userId}`);

    const { data: membership, error: membershipError } = await supabase
      .from('neighborhood_members')
      .select('neighborhood_id')
      .eq('user_id', userId);

    if (membershipError && membershipError.code !== 'PGRST116') {
      throw membershipError;
    }

    if (!membership || membership.length === 0) {
      return res.json({ neighborhood: null });
    }

    const { data: neighborhood, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', membership[0].neighborhood_id)
      .single();

    if (error) throw error;

    const { data: settings } = await supabase
      .from('neighborhood_settings')
      .select('*')
      .eq('neighborhood_id', neighborhood.id)
      .single();

    const enrichedData = {
      ...neighborhood,
      settings: settings ? {
        enableMarketplace: settings.enable_marketplace ?? true,
        enableResourceExchange: settings.enable_resource_exchange ?? true,
        enablePublicAlerts: settings.enable_public_alerts ?? true,
        enableEvents: settings.enable_events ?? true,
        enableServices: settings.enable_services ?? true,
        requireVerification: settings.require_verification ?? false,
      } : { 
        enableMarketplace: true, 
        enableResourceExchange: true,
        enablePublicAlerts: true,
        enableEvents: true,
        enableServices: true,
        requireVerification: false,
      },
    };

    const transformedData = transformNeighborhood(enrichedData);
    res.json({ neighborhood: transformedData });
  } catch (error) {
    console.error('Error fetching user neighborhood:', error);
    console.error('Error details:', error.message, error.code);
    res.status(500).json({ error: error.message, details: error.code });
  }
});

// Get all neighborhoods a user is enrolled in
router.get('/users/:userId/enrolled-neighborhoods', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get neighborhood IDs from neighborhood_members
    const { data: memberships, error: membershipError } = await supabase
      .from('neighborhood_members')
      .select('neighborhood_id')
      .eq('user_id', userId);
    
    if (membershipError) throw membershipError;
    
    if (!memberships || memberships.length === 0) {
      return res.json([]);
    }
    
    const neighborhoodIds = memberships.map(m => m.neighborhood_id);
    
    // Get neighborhood details
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from('neighborhoods')
      .select('*')
      .in('id', neighborhoodIds);
    
    if (neighborhoodsError) throw neighborhoodsError;
    
    // Transform data
    const transformedData = (neighborhoods || []).map(transformNeighborhood);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching enrolled neighborhoods:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
