import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// ===================================================================
// Transformation Helpers
// ===================================================================

const transformNeighborhood = (data) => ({
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    description: data.description,
    population: data.population,
    primaryLandmark: data.primary_landmark,
    adminId: data.admin_id,
    leadId: data.admin_id,
    leadName: data.lead_name || 'System Admin',
    verified: data.verified,
    createdDate: data.created_date,
    coverPhoto: data.cover_photo,
    logo: data.logo,
    guidelines: data.guidelines,
    settings: data.settings,
});

// Hardcoded test user ID (no JWT needed)
const HARDCODED_USER_ID = '11111111-1111-1111-1111-111111111111';

// ===================================================================
// Helper Functions
// ===================================================================

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
 *
 * Checks whether the user's GPS location corresponds to the neighbourhood city.
 * Handles abbreviations (IS → Islamabad), adjacent areas, and Nominatim's
 * inconsistent hierarchy for Pakistani cities.
 *
 * Returns true (match) or false (no match) — no "pending" middle ground.
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
    //    e.g. token "islamabad capital territory" contains "islamabad"
    if (tokens.some(t => t.includes(nbCity))) return true;

    // 4. Neighbourhood city appears in the full Nominatim display name
    //    This catches cases like Rawalpindi coords where displayName includes "Islamabad"
    if (display.includes(nbCity)) return true;

    // 5. Handle state abbreviations stored in DB (e.g. "IS" for Islamabad)
    //    Map known Pakistani abbreviations to full names
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
        // State matches — also require city to be in the same region
        // Only use state-only match if city field is empty (ambiguous GPS)
        if (!geolocation.city) return true;
    }

    return false;
}

// ===================================================================
// Helper: flip users.verified = true when BOTH conditions met
// ===================================================================
/**
 * Sets users.verified = true when:
 *   1. verification_requests has an 'approved' row for this user  (OCR/document)
 *   2. neighborhood_members   has a  'verified' row for this user (location)
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
        console.log(`[VERIFIED CHECK] userId=${userId} docApproved=${!!docApproval} locVerified=${!!locVerified} → setVerified=${bothVerified}`);

        if (bothVerified) {
            const { error } = await supabase
                .from('users')
                .update({ verified: true })
                .eq('id', userId);

            if (error) {
                console.error('[VERIFIED CHECK] Failed to set users.verified:', error.message);
            } else {
                console.log(`[VERIFIED CHECK] ✓ users.verified = true for userId=${userId}`);
            }
        }
    } catch (err) {
        console.error('[VERIFIED CHECK] error (non-fatal):', err.message);
    }
}

// ===================================================================
// Routes
// ===================================================================

/**
 * POST /api/neighborhoods/:id/join
 * Join a neighborhood with location verification
 * Body: { latitude, longitude, userId }
 * 
 * Flow:
 * 1. Get user's registered address from users table
 * 2. Get neighborhood's location from neighborhoods table
 * 3. Reverse geocode browser geolocation coordinates
 * 4. Compare user address with geolocation result
 * 5. Set status to 'verified' if match, 'pending' if not
 */
router.post('/neighborhoods/:id/join', async (req, res) => {
    try {
        const neighborhoodId = req.params.id;
        const { latitude, longitude, userId } = req.body;

        // Use provided userId or fall back to hardcoded test user
        const currentUserId = userId || HARDCODED_USER_ID;

        console.log(`[JOIN] neighborhoodId=${neighborhoodId} userId=${currentUserId} lat=${latitude} lon=${longitude}`);

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error: 'Location coordinates (latitude, longitude) are required',
                code: 'MISSING_LOCATION',
            });
        }

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({
                error: 'Latitude and longitude must be numbers',
                code: 'INVALID_COORDINATES',
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'Invalid coordinates range',
                code: 'COORDINATES_OUT_OF_RANGE',
            });
        }

        // STEP 1: Fetch user — try both string and integer id
        let user = null;
        let userError = null;

        // Try as-is first
        const result1 = await supabase.from('users').select('id, name, email, address').eq('id', currentUserId).single();
        if (!result1.error && result1.data) {
            user = result1.data;
        } else {
            // Try as integer (in case localStorage stored it as string)
            const asInt = parseInt(currentUserId);
            if (!isNaN(asInt)) {
                const result2 = await supabase.from('users').select('id, name, email, address').eq('id', asInt).single();
                if (!result2.error && result2.data) {
                    user = result2.data;
                } else {
                    userError = result2.error;
                }
            } else {
                userError = result1.error;
            }
        }

        if (!user) {
            console.error(`[JOIN] User not found: userId=${currentUserId}`, userError?.message);
            return res.status(404).json({
                error: `User not found (id: ${currentUserId})`,
                code: 'USER_NOT_FOUND',
            });
        }

        // STEP 2: Fetch neighborhood data
        const { data: neighborhood, error: neighError } = await supabase
            .from('neighborhoods')
            .select('id, name, city, state')
            .eq('id', neighborhoodId)
            .single();

        if (neighError || !neighborhood) {
            console.error(`[JOIN] Neighborhood not found: id=${neighborhoodId}`, neighError?.message);
            return res.status(404).json({
                error: 'Neighborhood not found',
                code: 'NEIGHBORHOOD_NOT_FOUND',
            });
        }

        console.log(`[JOIN] User="${user.name}" joining "${neighborhood.name}" (${neighborhood.city}, ${neighborhood.state})`);

        // STEP 2.5: Check if user is already a member of ANOTHER neighborhood
        const { data: existingMembership, error: membershipError } = await supabase
            .from('neighborhood_members')
            .select('neighborhood_id')
            .eq('user_id', user.id);

        if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;

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

        // STEP 3: Reverse geocode user's browser location
        const geolocation = await reverseGeocode(latitude, longitude);

        console.log(`[JOIN] Geocode result:`);
        console.log(`  city="${geolocation.city}" suburb="${geolocation.suburb}" county="${geolocation.county}" state="${geolocation.state}"`);
        console.log(`  displayName="${geolocation.displayName}"`);
        console.log(`  allTokens=${JSON.stringify(geolocation.allTokens)}`);
        console.log(`  Neighborhood expects: city="${neighborhood.city}" state="${neighborhood.state}"`);

        // STEP 4: Smart location match — binary: verified or rejected, no pending
        const locationMatches = locationsMatch(geolocation, neighborhood.city, neighborhood.state);
        console.log(`[JOIN] locationMatches=${locationMatches}`);

        // STEP 5: If location does NOT match → reject immediately, do NOT insert
        if (!locationMatches) {
            return res.status(403).json({
                success: false,
                matched: false,
                code: 'LOCATION_MISMATCH',
                message: `Your location does not match ${neighborhood.name}. You must be physically located in ${neighborhood.city} to join.`,
                neighborhood: {
                    id: neighborhood.id,
                    name: neighborhood.name,
                    city: neighborhood.city,
                    state: neighborhood.state,
                },
                neighborhoodLocation: {
                    city: neighborhood.city,
                    state: neighborhood.state,
                },
                userLocation: {
                    city: geolocation.city || geolocation.suburb || geolocation.county,
                    state: geolocation.state,
                    displayName: geolocation.displayName,
                },
            });
        }

        // STEP 6: Location matched → insert as verified
        const { error: insertError } = await supabase
            .from('neighborhood_members')
            .insert([{
                user_id: user.id,
                neighborhood_id: neighborhoodId,
                joined_date: new Date().toISOString(),
                status: 'verified',
                verified_at: new Date().toISOString(),
                user_location_city: geolocation.city || geolocation.suburb || geolocation.county,
                user_location_state: geolocation.state,
            }]);

        // If already a member, update to verified
        if (insertError && insertError.code === '23505') {
            const { error: updateError } = await supabase
                .from('neighborhood_members')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                    user_location_city: geolocation.city || geolocation.suburb || geolocation.county,
                    user_location_state: geolocation.state,
                })
                .eq('user_id', user.id)
                .eq('neighborhood_id', neighborhoodId);

            if (updateError) throw updateError;
            console.log(`[JOIN] Updated existing membership to verified`);
        } else if (insertError) {
            throw insertError;
        } else {
            console.log(`[JOIN] New verified membership created`);
        }

        // Check if both location + document are now verified → flip users.verified
        await checkAndSetUserVerified(user.id);

        return res.status(201).json({
            success: true,
            matched: true,
            status: 'verified',
            message: `Welcome to ${neighborhood.name}!`,
            neighborhood: {
                id: neighborhood.id,
                name: neighborhood.name,
                city: neighborhood.city,
                state: neighborhood.state,
            },
            neighborhoodLocation: {
                city: neighborhood.city,
                state: neighborhood.state,
            },
            userLocation: {
                city: geolocation.city || geolocation.suburb || geolocation.county,
                state: geolocation.state,
                displayName: geolocation.displayName,
            },
            verification: {
                status: 'verified',
                verified_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error in join neighborhood:', error);
        res.status(500).json({
            error: error.message || 'Failed to join neighborhood',
            code: 'JOIN_ERROR',
        });
    }
});

/**
 * GET /api/neighborhoods/:id/members/count
 * Get the number of members in a neighborhood
 * No authentication required (public read)
 */
router.get('/neighborhoods/:id/members/count', async (req, res) => {
    try {
        const neighborhoodId = req.params.id;

        const { count, error } = await supabase
            .from('neighborhood_members')
            .select('*', { count: 'exact', head: true })
            .eq('neighborhood_id', neighborhoodId);

        if (error) throw error;

        res.json({
            success: true,
            neighborhoodId,
            count: count || 0,
        });
    } catch (error) {
        console.error('Error getting member count:', error);
        res.status(500).json({
            error: error.message || 'Failed to get member count',
            code: 'COUNT_ERROR',
        });
    }
});

/**
 * POST /api/neighborhoods/leave
 * Generic leave route — finds the user's current membership and deletes it
 */
router.post('/neighborhoods/leave', async (req, res) => {
    try {
        const userId = req.body.userId || req.query.userId || HARDCODED_USER_ID;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required', code: 'MISSING_USER_ID' });
        }

        const { data, error } = await supabase
            .from('neighborhood_members')
            .delete()
            .eq('user_id', String(userId))
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Left neighborhood successfully',
            count: data?.length || 0
        });
    } catch (error) {
        console.error('Error leaving neighborhood (generic):', error);
        res.status(500).json({
            error: error.message || 'Failed to leave neighborhood',
            code: 'LEAVE_ERROR',
        });
    }
});

/**
 * DELETE /api/neighborhoods/:id/leave
 * Specific leave route
 */
router.delete('/neighborhoods/:id/leave', async (req, res) => {
    try {
        const neighborhoodId = req.params.id;
        const userId = req.body.userId || req.query.userId || HARDCODED_USER_ID;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required', code: 'MISSING_USER_ID' });
        }

        const { data, error } = await supabase
            .from('neighborhood_members')
            .delete()
            .eq('user_id', String(userId))
            .eq('neighborhood_id', neighborhoodId)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Left neighborhood successfully',
        });
    } catch (error) {
        console.error('Error leaving neighborhood:', error);
        res.status(500).json({
            error: error.message || 'Failed to leave neighborhood',
            code: 'LEAVE_ERROR',
        });
    }
});

/**
 * GET /api/neighborhoods/:id/members
 * Get all members of a neighborhood (admin/public info only)
 * No authentication required
 */
router.get('/neighborhoods/:id/members', async (req, res) => {
    try {
        const neighborhoodId = req.params.id;

        const { data: members, error } = await supabase
            .from('neighborhood_members')
            .select('id, user_id, joined_date')
            .eq('neighborhood_id', neighborhoodId)
            .order('joined_date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            neighborhoodId,
            members: members || [],
            count: (members || []).length,
        });
    } catch (error) {
        console.error('Error getting members:', error);
        res.status(500).json({
            error: error.message || 'Failed to get members',
            code: 'MEMBERS_ERROR',
        });
    }
});

/**
 * GET /api/neighborhoods/:id/members/check
 * Check if current user is a member and their verification status
 */
router.get('/neighborhoods/:id/members/check', async (req, res) => {
    try {
        const neighborhoodId = req.params.id;
        const userId = req.query.userId || HARDCODED_USER_ID;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required', code: 'MISSING_USER_ID' });
        }

        const { data: member, error } = await supabase
            .from('neighborhood_members')
            .select('id, joined_date, status, verified_at, user_location_city, user_location_state')
            .eq('user_id', String(userId))
            .eq('neighborhood_id', neighborhoodId)
            .single();

        if (error && error.code === 'PGRST116') {
            // No member found
            return res.json({
                success: true,
                isMember: false,
                status: null,
            });
        }

        if (error) throw error;

        res.json({
            success: true,
            isMember: !!member,
            joinedDate: member?.joined_date || null,
            status: member?.status || 'unknown', // 'pending' or 'verified'
            verified_at: member?.verified_at || null,
            userLocation: {
                city: member?.user_location_city || null,
                state: member?.user_location_state || null,
            },
        });
    } catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({
            error: error.message || 'Failed to check membership',
            code: 'CHECK_ERROR',
        });
    }
});

/**
 * GET /api/user/:userId/memberships
 * Get all neighborhoods a user is member of with status
 */
router.get('/user/:userId/memberships', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: memberships, error } = await supabase
            .from('neighborhood_members')
            .select(`
        id,
        neighborhood_id,
        joined_date,
        status,
        verified_at,
        user_location_city,
        user_location_state,
        neighborhoods:neighborhood_id(id, name, city, state)
      `)
            .eq('user_id', userId)
            .order('joined_date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            userId,
            memberships: memberships || [],
            count: (memberships || []).length,
            verified_count: (memberships || []).filter(m => m.status === 'verified').length,
            pending_count: (memberships || []).filter(m => m.status === 'pending').length,
        });
    } catch (error) {
        console.error('Error getting user memberships:', error);
        res.status(500).json({
            error: error.message || 'Failed to get memberships',
            code: 'MEMBERSHIPS_ERROR',
        });
    }
});

/**
 * GET /api/users/:userId/neighborhood
 * Get user's current neighborhood (formatted for frontend)
 */
router.get('/users/:userId/neighborhood', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`[GET_NBH] Fetching current neighborhood for user ${userId}`);

        const { data: membership, error: membershipError } = await supabase
            .from('neighborhood_members')
            .select('neighborhood_id')
            .eq('user_id', userId)
            .limit(1);

        if (membershipError && membershipError.code !== 'PGRST116') throw membershipError;

        if (!membership || membership.length === 0) {
            return res.json({ neighborhood: null });
        }

        const neighborhoodId = membership[0].neighborhood_id;

        // Fetch neighborhood data
        const { data: neighborhood, error: neighError } = await supabase
            .from('neighborhoods')
            .select('*')
            .eq('id', neighborhoodId)
            .single();

        if (neighError) throw neighError;

        // Fetch settings
        const { data: settings } = await supabase
            .from('neighborhood_settings')
            .select('*')
            .eq('neighborhood_id', neighborhoodId)
            .single();

        // Fetch lead name
        let leadName = 'System Admin';
        if (neighborhood.admin_id) {
            const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', neighborhood.admin_id)
                .single();

            if (userData) leadName = userData.name;
        }

        const enrichedData = {
            ...neighborhood,
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
        res.json({ neighborhood: transformedData });

    } catch (error) {
        console.error('[GET_NBH] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to fetch user neighborhood',
            code: 'GET_NBH_ERROR'
        });
    }
});

export default router;
