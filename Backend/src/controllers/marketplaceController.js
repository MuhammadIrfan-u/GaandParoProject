import { supabase } from '../supabaseClient.js';
import * as marketplaceItemFraudService from '../services/marketplaceItemFraud.service.js';

// Transform marketplace item from snake_case to camelCase
const transformListing = (data) => ({
    id: data.id.toString(),
    sellerId: data.seller_id?.toString(),
    title: data.title,
    description: data.description,
    price: data.price,
    condition: data.condition,
    category: data.category,
    image: data.image,
    postedDate: data.posted_date,
    status: data.status,
    isFlagged: data.is_flagged,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status,
});

// GET /api/marketplace — Browse & search listings
export const getListings = async (req, res) => {
    try {
        const { search, category, condition, minPrice, maxPrice, status } = req.query;

        let query = supabase
            .from('marketplace_items')
            .select('*')
            .eq('moderation_status', 'approved')
            .order('posted_date', { ascending: false });

        // Filter by status (default to 'available')
        query = query.eq('status', status || 'available');

        // Filter by category
        if (category) {
            query = query.eq('category', category);
        }

        // Filter by condition
        if (condition) {
            query = query.eq('condition', condition);
        }

        // Filter by price range
        if (minPrice) {
            query = query.gte('price', parseFloat(minPrice));
        }
        if (maxPrice) {
            query = query.lte('price', parseFloat(maxPrice));
        }

        // Search by title or description
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        const transformedData = (data || []).map(transformListing);
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/marketplace/:id — Get single listing
export const getListingById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('marketplace_items')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(transformListing(data));
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/marketplace — Create a new listing
export const createListing = async (req, res) => {
    try {
        const { sellerId, title, description, price, condition, category, image } = req.body;

        // Validate required fields
        if (!sellerId || !title || !description || !price || !condition || !category) {
            return res.status(400).json({
                error: 'Missing required fields: sellerId, title, description, price, condition, category',
            });
        }

        // Validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Price must be a valid positive number' });
        }

        console.log('DEBUG: Creating listing for seller:', sellerId);

        const { data, error } = await supabase
            .from('marketplace_items')
            .insert([{
                seller_id: parseInt(sellerId),
                title,
                description,
                price: parsedPrice,
                condition,
                category,
                image: image || null,
                posted_date: new Date().toISOString(),
                status: 'available',
                is_flagged: false,
                moderation_status: 'approved',
            }])
            .select()
            .single();

        if (error) throw error;

        // Background Fraud Check
        marketplaceItemFraudService.check({
            id: data.id,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category
        }).catch(err => console.error('Marketplace fraud check error:', err));

        res.status(201).json(transformListing(data));
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ error: error.message });
    }
};
// UPDATE /api/marketplace/:id — Update a listing
export const updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { sellerId, title, description, price, condition, category, image, status } = req.body;

        // Verify ownership
        const { data: item, error: fetchError } = await supabase
            .from('marketplace_items')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (fetchError || !item) return res.status(404).json({ error: 'Listing not found' });
        if (parseInt(item.seller_id) !== parseInt(sellerId)) {
            return res.status(403).json({ error: 'Unauthorized: Only the seller can update this listing' });
        }

        const { data, error } = await supabase
            .from('marketplace_items')
            .update({
                title,
                description,
                price: price ? parseFloat(price) : undefined,
                condition,
                category,
                image,
                status,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(transformListing(data));
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/marketplace/:id — Delete a listing
export const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { sellerId } = req.query; // Passed as query param

        // Verify ownership
        const { data: item, error: fetchError } = await supabase
            .from('marketplace_items')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (fetchError || !item) return res.status(404).json({ error: 'Listing not found' });
        if (parseInt(item.seller_id) !== parseInt(sellerId)) {
            return res.status(403).json({ error: 'Unauthorized: Only the seller can delete this listing' });
        }

        const { error } = await supabase
            .from('marketplace_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ error: error.message });
    }
};
