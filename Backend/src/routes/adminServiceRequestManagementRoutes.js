import express from 'express';
import * as serviceRequestManagementController from '../controllers/serviceRequestManagementController.js';

/**
 * Routes for managing service requests per neighborhood
 * These routes allow neighborhood admins to view and analyze service request activity
 * 
 * Base path: /api/admin/service-requests
 */

const router = express.Router();

/**
 * GET /admin/service-requests/neighborhood/:neighborhoodId
 * Get all service requests for a specific neighborhood
 * Query params: ?status=pending|accepted|completed|cancelled|rejected&providerId=123
 */
router.get('/neighborhood/:neighborhoodId', serviceRequestManagementController.getNeighborhoodServiceRequests);

/**
 * GET /admin/service-requests/stats/:neighborhoodId
 * Get service request statistics for a neighborhood
 * Returns: { total, byStatus, byCategory, conversionRate }
 */
router.get('/stats/:neighborhoodId', serviceRequestManagementController.getServiceRequestStats);

/**
 * GET /admin/service-requests/pending/:neighborhoodId
 * Get pending (unresponded) service requests in a neighborhood
 * Useful for showing urgent items that need attention
 */
router.get('/pending/:neighborhoodId', serviceRequestManagementController.getPendingServiceRequests);

/**
 * GET /admin/service-requests/provider-metrics/:neighborhoodId
 * Get performance metrics for providers in a neighborhood
 * Shows request counts, response rates, completion rates, etc.
 */
router.get('/provider-metrics/:neighborhoodId', serviceRequestManagementController.getProviderMetrics);

export default router;
