import express from 'express';
import * as serviceManagementController from '../controllers/serviceManagementController.js';

/**
 * Routes for managing services per neighborhood
 * These routes allow neighborhood admins to view and control services in their neighborhood
 * 
 * Base path: /api/admin/services
 */

const router = express.Router();

/**
 * GET /admin/services/neighborhood/:neighborhoodId
 * Get all services for a specific neighborhood
 * Query params: ?showDisabled=true (to include disabled services)
 */
router.get('/neighborhood/:neighborhoodId', serviceManagementController.getNeighborhoodServices);

/**
 * GET /admin/services/stats/:neighborhoodId
 * Get service statistics for a neighborhood
 * Returns: { total, available, disabled, flagged, byCategory, averageRating }
 */
router.get('/stats/:neighborhoodId', serviceManagementController.getServiceStats);

/**
 * GET /admin/services/disabled/:neighborhoodId
 * Get all disabled services in a neighborhood
 */
router.get('/disabled/:neighborhoodId', serviceManagementController.getDisabledServices);

/**
 * PATCH /admin/services/:serviceId/availability
 * Toggle or set service availability
 * Body: { available: boolean }
 * Only provider or admin can call this
 */
router.patch('/:serviceId/availability', serviceManagementController.toggleServiceAvailability);

export default router;
