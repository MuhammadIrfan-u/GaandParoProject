import express from 'express';
import {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    uploadImages,        // multer middleware exported from controller
} from '../controllers/marketplaceController.js';

const router = express.Router();

// GET /api/marketplace — Browse & search all active listings
// Query params: search, category, condition, minPrice, maxPrice, status
router.get('/api/marketplace', getListings);

// GET /api/marketplace/:id — Get a single listing by ID
router.get('/api/marketplace/:id', getListingById);

// POST /api/marketplace — Create a new listing
// Body: multipart/form-data
//   - sellerId, title, description, price, condition, category  (required)
//   - images          up to 3 image files  (optional)
//   - imageUrls       JSON string array of pre-uploaded URLs     (optional alternative)
router.post('/api/marketplace', uploadImages, createListing);

// PUT /api/marketplace/:id — Update a listing
// Body: multipart/form-data (same fields as POST, all optional except sellerId)
//   - replaceImages   "true" to delete old images before uploading new ones
router.put('/api/marketplace/:id', uploadImages, updateListing);

// DELETE /api/marketplace/:id — Delete a listing + its storage images
// Query: sellerId
router.delete('/api/marketplace/:id', deleteListing);

export default router;