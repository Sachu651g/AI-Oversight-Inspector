import { Router } from 'express';
import { PatternAnalysisController } from '../controllers/PatternAnalysisController';

const router = Router();
const patternController = new PatternAnalysisController();

/**
 * @route   POST /api/pattern/analyze
 * @desc    Analyze climate patterns for a specific location
 * @access  Public (should be protected in production)
 */
router.post('/analyze', (req, res) => patternController.analyzeLocation(req, res));

/**
 * @route   POST /api/pattern/auto-refresh/start
 * @desc    Start auto-refresh (every 10 minutes) for a location
 * @access  Public (should be protected in production)
 */
router.post('/auto-refresh/start', (req, res) => patternController.startAutoRefresh(req, res));

/**
 * @route   POST /api/pattern/auto-refresh/stop
 * @desc    Stop auto-refresh for a location
 * @access  Public (should be protected in production)
 */
router.post('/auto-refresh/stop', (req, res) => patternController.stopAutoRefresh(req, res));

/**
 * @route   GET /api/pattern/auto-refresh/status
 * @desc    Get status of all active auto-refresh intervals
 * @access  Public
 */
router.get('/auto-refresh/status', (req, res) => patternController.getAutoRefreshStatus(req, res));

export default router;
