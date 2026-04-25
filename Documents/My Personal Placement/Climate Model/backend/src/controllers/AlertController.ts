import { Request, Response } from 'express';
import { DecisionBriefService } from '../services/DecisionBriefService';
import { AlertDispatchService } from '../services/AlertDispatchService';
import { AuditTrailService } from '../services/AuditTrailService';
import logger from '../config/logger';

export class AlertController {
  private briefService: DecisionBriefService;
  private dispatchService: AlertDispatchService;
  private auditService: AuditTrailService;

  constructor() {
    this.briefService = new DecisionBriefService();
    this.dispatchService = new AlertDispatchService();
    this.auditService = new AuditTrailService();
  }

  /**
   * POST /api/alert/generate
   * Generate AI-powered decision brief
   */
  async generateBrief(req: Request, res: Response): Promise<void> {
    try {
      const { riskData, language = 'English' } = req.body;

      if (!riskData) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'riskData is required',
        });
        return;
      }

      const startTime = Date.now();
      const brief = await this.briefService.generateBrief(riskData, language);
      const duration = Date.now() - startTime;

      logger.info(`Decision brief generated in ${duration}ms`);

      res.status(200).json({
        success: true,
        data: {
          brief: brief.brief,
          confidenceScore: brief.confidenceScore,
          language: brief.language,
          timestamp: brief.timestamp,
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Generate brief error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate decision brief',
      });
    }
  }

  /**
   * POST /api/alert/dispatch
   * Dispatch alert via SMS/Email/WhatsApp
   */
  async dispatchAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId, message, recipients, channels = ['SMS'] } = req.body;

      if (!alertId || !message || !recipients || !Array.isArray(recipients)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'alertId, message, and recipients (array) are required',
        });
        return;
      }

      const dispatch = await this.dispatchService.dispatchAlert(
        alertId,
        message,
        recipients,
        channels
      );

      // Log to audit trail
      await this.auditService.logAlert({
        zoneId: 'zone-placeholder',
        riskLevel: 'High',
        decisionBrief: message,
        userId: 'user-placeholder',
        parameters: { alertId, channels },
      });

      res.status(200).json({
        success: true,
        data: {
          dispatchId: dispatch.id,
          status: dispatch.status,
          deliveryStatus: dispatch.deliveryStatus,
          timestamp: dispatch.timestamp,
        },
      });
    } catch (error) {
      logger.error('Dispatch alert error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to dispatch alert',
      });
    }
  }

  /**
   * GET /api/alert/status/:dispatchId
   * Get alert dispatch status
   */
  async getDispatchStatus(req: Request, res: Response): Promise<void> {
    try {
      const { dispatchId } = req.params;

      if (!dispatchId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'dispatchId is required',
        });
        return;
      }

      const dispatch = await this.dispatchService.getDispatchStatus(dispatchId);

      if (!dispatch) {
        res.status(404).json({
          error: 'Not Found',
          message: `Dispatch ${dispatchId} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispatch,
      });
    } catch (error) {
      logger.error('Get dispatch status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get dispatch status',
      });
    }
  }
}
