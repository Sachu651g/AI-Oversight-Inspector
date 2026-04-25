import { Router } from 'express';
import { SimulationController } from '../controllers/SimulationController';

const router = Router();
const simulationController = new SimulationController();

/**
 * @route   POST /api/simulate/generate
 * @desc    Generate 12-frame disaster simulation
 * @access  Public (should be protected in production)
 */
router.post('/generate', (req, res) => simulationController.generateSimulation(req, res));

/**
 * @route   GET /api/simulate/frames/:simulationId
 * @desc    Get specific simulation frame
 * @access  Public
 */
router.get('/frames/:simulationId', (req, res) => simulationController.getSimulationFrame(req, res));

/**
 * @route   GET /api/simulate/history
 * @desc    Get simulation history
 * @access  Public
 */
router.get('/history', (req, res) => simulationController.getSimulationHistory(req, res));

export default router;
