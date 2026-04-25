import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';

const router = Router();
const alertController = new AlertController();

/**
 * @route   POST /api/alert/generate
 * @desc    Generate AI-powered decision brief
 * @access  Public (should be protected in production)
 */
router.post('/generate', (req, res) => alertController.generateBrief(req, res));

/**
 * @route   POST /api/alert/dispatch
 * @desc    Dispatch alert via SMS/Email/WhatsApp
 * @access  Public (should be protected in production)
 */
router.post('/dispatch', (req, res) => alertController.dispatchAlert(req, res));

/**
 * @route   GET /api/alert/status/:dispatchId
 * @desc    Get alert dispatch status
 * @access  Public
 */
router.get('/status/:dispatchId', (req, res) => alertController.getDispatchStatus(req, res));

export default router;
