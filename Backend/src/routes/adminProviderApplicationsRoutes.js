import express from 'express';
import * as providerApplicationController from '../controllers/providerApplicationController.js';

/**
 * Routes for managing provider applications per neighborhood
 * These routes are used by neighborhood admins to review and approve/reject provider applications
 * 
 * Base path: /api/admin/provider-applications
 */

const router = express.Router();

/**
 * GET /admin/provider-applications/neighborhood/:neighborhoodId
 * Get all applications for a specific neighborhood
 * Query params: ?status=pending|approved|rejected (optional)
 */
router.get('/neighborhood/:neighborhoodId', providerApplicationController.getApplicationsByNeighborhood);

/**
 * GET /admin/provider-applications/stats/:neighborhoodId
 * Get statistics about applications in a neighborhood
 * Returns: { pending, approved, rejected, total }
 */
router.get('/stats/:neighborhoodId', providerApplicationController.getApplicationsStats);

/**
 * POST /admin/provider-applications/:applicationId/approve
 * Approve a provider application
 * Body: { neighborhoodId }
 */
router.post('/:applicationId/approve', providerApplicationController.approveApplication);

/**
 * POST /admin/provider-applications/:applicationId/reject
 * Reject a provider application
 * Body: { neighborhoodId, reason }
 */
router.post('/:applicationId/reject', providerApplicationController.rejectApplication);

/**
 * GET /admin/provider-applications/check/:userId/:neighborhoodId
 * Check if a user is an approved provider in a neighborhood
 * Used to gate service creation/editing
 */
router.get('/check/:userId/:neighborhoodId', providerApplicationController.isApprovedProviderInNeighborhood);

/**
 * GET /admin/provider-applications/user-status/:userId/:neighborhoodId
 * Get a user's application status in a specific neighborhood
 * Returns application details if exists, null if no application
 */
router.get('/user-status/:userId/:neighborhoodId', providerApplicationController.getUserApplicationStatus);

/**
 * GET /admin/provider-applications/user-neighborhoods/:userId
 * Get all neighborhoods where a user is an approved provider
 * Useful for provider dashboard
 */
router.get('/user-neighborhoods/:userId', providerApplicationController.getUserApprovedNeighborhoods);

export default router;
