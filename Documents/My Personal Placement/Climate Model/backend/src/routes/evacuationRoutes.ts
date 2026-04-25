import { Router } from 'express';
import { EvacuationController } from '../controllers/EvacuationController';

const router = Router();
const evacuationController = new EvacuationController();

/**
 * @route   POST /api/evacuation-routes/calculate
 * @desc    Calculate evacuation routes for high-risk zones
 * @access  Public (should be protected in production)
 */
router.post('/calculate', (req, res) => evacuationController.calculateRoutes(req, res));

/**
 * @route   GET /api/evacuation-routes/:zoneId
 * @desc    Get evacuation routes for specific zone
 * @access  Public
 */
router.get('/:zoneId', (req, res) => evacuationController.getRoutesForZone(req, res));

/**
 * @route   POST /api/evacuation-routes/optimize
 * @desc    Optimize evacuation routes with constraints
 * @access  Public (should be protected in production)
 */
router.post('/optimize', (req, res) => evacuationController.optimizeRoutes(req, res));

export default router;
