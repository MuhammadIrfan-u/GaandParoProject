import express from 'express';
import {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
} from '../controllers/marketplaceController.js';

const router = express.Router();

// GET /api/marketplace — Browse & search all active listings
// Query params: search, category, condition, minPrice, maxPrice, status
router.get('/api/marketplace', getListings);

// GET /api/marketplace/:id — Get a single listing by ID
router.get('/api/marketplace/:id', getListingById);

// POST /api/marketplace — Post a new listing
// Body: { sellerId, title, description, price, condition, category, image? }
router.post('/api/marketplace', createListing);

// PUT /api/marketplace/:id — Update a listing
router.put('/api/marketplace/:id', updateListing);

// DELETE /api/marketplace/:id — Delete a listing
router.delete('/api/marketplace/:id', deleteListing);

export default router;
