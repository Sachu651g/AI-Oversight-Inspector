import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';

const router = Router();
const auditController = new AuditController();

/**
 * @route   GET /api/audit-trail
 * @desc    Get audit trail records with filters
 * @access  Public (should be protected in production - Auditor role only)
 */
router.get('/', (req, res) => auditController.getAuditTrail(req, res));

/**
 * @route   POST /api/audit-trail/verify
 * @desc    Verify audit trail integrity
 * @access  Public (should be protected in production - Auditor role only)
 */
router.post('/verify', (req, res) => auditController.verifyIntegrity(req, res));

/**
 * @route   GET /api/transparency
 * @desc    Get transparency metrics
 * @access  Public
 */
router.get('/transparency', (req, res) => auditController.getTransparencyMetrics(req, res));

/**
 * @route   GET /api/audit-trail/export
 * @desc    Export audit trail (JSON or CSV)
 * @access  Public (should be protected in production - Auditor role only)
 */
router.get('/export', (req, res) => auditController.exportAuditTrail(req, res));

export default router;
