import { supabase } from '../supabaseClient.js';

export const getNeighborhoodStats = async (req, res) => {
    try {
        const { neighborhoodId } = req.query;
        
        let userQuery = supabase.from('neighborhood_members').select('*', { count: 'exact', head: true });
        let alertQuery = supabase.from('alerts').select('*', { count: 'exact', head: true });
        let eventQuery = supabase.from('events').select('*', { count: 'exact', head: true });
        let marketplaceQuery = supabase.from('marketplace_items').select('*', { count: 'exact', head: true });
        let serviceQuery = supabase.from('services').select('*', { count: 'exact', head: true });
        let reviewQuery = supabase.from('reviews').select('*', { count: 'exact', head: true });

        if (neighborhoodId) {
            userQuery = userQuery.eq('neighborhood_id', neighborhoodId);
            alertQuery = alertQuery.eq('neighborhood_id', neighborhoodId);
            eventQuery = eventQuery.eq('neighborhood_id', neighborhoodId);
            marketplaceQuery = marketplaceQuery.eq('neighborhood_id', neighborhoodId);
            serviceQuery = serviceQuery.eq('neighborhood_id', neighborhoodId);
            // reviews table has typo 'neighborhod_id'
            reviewQuery = reviewQuery.eq('neighborhod_id', neighborhoodId);
        }

        const results = await Promise.all([
            userQuery,
            alertQuery,
            eventQuery,
            marketplaceQuery,
            serviceQuery,
            reviewQuery
        ]);
        
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
