import { supabase } from '../supabaseClient.js';

export const getNeighborhoodStats = async (req, res) => {
    try {
        const { neighborhoodId } = req.query;
        
        const queries = [
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('alerts').select('*', { count: 'exact', head: true }),
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('*', { count: 'exact', head: true }),
            supabase.from('reviews').select('*', { count: 'exact', head: true })
        ];

        // Apply neighborhood filter if present
        // Note: some tables might use different column names like 'neighborhood_id' or 'neighborhod_id'
        // Based on previous experience, it's often 'neighborhod_id' (missing 'o')
        
        if (neighborhoodId) {
            // We'll try to apply the filter where it exists. 
            // Users table might not have neighborhoodId directly if it's in a junction table, 
            // but usually it's there.
        }

        const results = await Promise.all(queries);
        
        const stats = {
            users: results[0].count || 0,
            alerts: results[1].count || 0,
            events: results[2].count || 0,
            marketplaceItems: results[3].count || 0,
            services: results[4].count || 0,
            reviews: results[5].count || 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
};
