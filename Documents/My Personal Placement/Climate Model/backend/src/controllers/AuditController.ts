import { Request, Response } from 'express';
import { AuditTrailService } from '../services/AuditTrailService';
import logger from '../config/logger';

export class AuditController {
  private auditService: AuditTrailService;

  constructor() {
    this.auditService = new AuditTrailService();
  }

  /**
   * GET /api/audit-trail
   * Get audit trail records with filters
   */
  async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const {
        limit = 50,
        offset = 0,
        zoneId,
        riskLevel,
        startDate,
        endDate,
      } = req.query;

      const filters = {
        limit: Number(limit),
        offset: Number(offset),
        zoneId: zoneId as string,
        riskLevel: riskLevel as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const { records, total } = await this.auditService.getRecords(filters);

      res.status(200).json({
        success: true,
        data: {
          records,
          total,
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error) {
      logger.error('Get audit trail error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get audit trail',
      });
    }
  }

  /**
   * POST /api/audit-trail/verify
   * Verify audit trail integrity
   */
  async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.body;

      const startTime = Date.now();
      const result = await this.auditService.verifyIntegrity(recordId);
      const duration = Date.now() - startTime;

      logger.info(
        `Audit trail verification completed in ${duration}ms: ${result.verified ? 'VERIFIED' : 'TAMPERED'}`
      );

      res.status(200).json({
        success: true,
        data: {
          verified: result.verified,
          tamperedRecords: result.tamperedRecords,
          totalRecords: result.totalRecords,
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Verify integrity error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify audit trail integrity',
      });
    }
  }

  /**
   * GET /api/transparency
   * Get transparency metrics
   */
  async getTransparencyMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.auditService.getTransparencyMetrics();

      res.status(200).json({
        success: true,
        data: {
          metrics,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Get transparency metrics error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get transparency metrics',
      });
    }
  }

  /**
   * GET /api/audit-trail/export
   * Export audit trail
   */
  async exportAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json' } = req.query;

      const data = await this.auditService.exportAuditTrail(format as 'json' | 'csv');

      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `audit-trail-${new Date().toISOString()}.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(data);
    } catch (error) {
      logger.error('Export audit trail error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to export audit trail',
      });
    }
  }
}
