import { Router } from 'express';
import { RiskController } from '../controllers/RiskController';

const router = Router();
const riskController = new RiskController();

/**
 * @route   POST /api/risk/classify
 * @desc    Classify risk for multiple zones based on weather parameters
 * @access  Public (should be protected in production)
 */
router.post('/classify', (req, res) => riskController.classifyRisk(req, res));

/**
 * @route   POST /api/risk/update
 * @desc    Update weather parameters
 * @access  Public (should be protected in production)
 */
router.post('/update', (req, res) => riskController.updateParameters(req, res));

/**
 * @route   GET /api/risk/parameters
 * @desc    Get current weather parameters
 * @access  Public
 */
router.get('/parameters', (req, res) => riskController.getParameters(req, res));

export default router;
