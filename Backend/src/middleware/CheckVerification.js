import { supabase } from '../supabaseClient.js';

/**
 * Middleware: Forced Verification (SCRUM-21)
 * 
 * Checks if a neighborhood requires user verification.
 * If yes, ensures the user is verified before allowing access.
 * 
 * Place this AFTER requireAuth middleware in routes.
 * 
 * Acceptance Criteria:
 * 1. User will get to document verification page (via 403 response)
 * 2. Once document verified from admin side, user can browse neighborhood
 */
const checkVerification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        // Extract neighborhood ID from various possible locations
        const neighborhoodId = 
            req.params.neighborhoodId || 
            req.params.id || 
            req.body.neighborhoodId || 
            req.body.neighborhood_id;

        // If no user or no neighborhood specified, allow (other middleware will handle)
        if (!userId || !neighborhoodId) {
            return next();
        }

        console.log(`[checkVerification] Checking user ${userId} for neighborhood ${neighborhoodId}`);

        // Step 1: Fetch neighborhood settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('neighborhood_settings')
            .select('require_verification')
            .eq('neighborhood_id', neighborhoodId)
            .single();

        if (settingsError) {
            console.error('[checkVerification] Error fetching settings:', settingsError);
            // If settings don't exist, default to not requiring verification
            return next();
        }

        // Step 2: Check if verification is required
        if (!settingsData?.require_verification) {
            console.log(`[checkVerification] Neighborhood ${neighborhoodId} does not require verification`);
            return next();
        }

        console.log(`[checkVerification] Neighborhood ${neighborhoodId} REQUIRES verification`);

        // Step 3: Check if user is verified
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('verified, name')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('[checkVerification] Error fetching user:', userError);
            return res.status(500).json({
                success: false,
                message: 'Error checking verification status'
            });
        }

        // Step 4: Block if not verified
        if (!userData.verified) {
            console.log(`[checkVerification] User ${userId} (${userData.name}) is NOT verified. Blocking access.`);
            
            // Fetch neighborhood name for better error message
            const { data: neighborhoodData } = await supabase
                .from('neighborhoods')
                .select('name')
                .eq('id', neighborhoodId)
                .single();

            const neighborhoodName = neighborhoodData?.name || 'this neighborhood';

            return res.status(403).json({
                success: false,
                message: `Access denied. ${neighborhoodName} requires verified members. Please complete document verification first.`,
                requiresVerification: true,
                verified: false,
                neighborhoodId: neighborhoodId,
                redirectTo: '/verify-residence',
                // Additional context for frontend
                reason: 'VERIFICATION_REQUIRED',
                neighborhoodName: neighborhoodName
            });
        }

        // Step 5: User is verified, allow access
        console.log(`[checkVerification] User ${userId} (${userData.name}) is verified. Access granted.`);
        next();

    } catch (error) {
        console.error('[checkVerification] Unexpected error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking verification status'
        });
    }
};

export { checkVerification };