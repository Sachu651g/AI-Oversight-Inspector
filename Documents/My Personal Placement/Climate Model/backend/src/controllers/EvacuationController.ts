import { Request, Response } from 'express';
import { EvacuationRoutingService, AssemblyPoint } from '../services/EvacuationRoutingService';
import logger from '../config/logger';

export class EvacuationController {
  private routingService: EvacuationRoutingService;

  constructor() {
    this.routingService = new EvacuationRoutingService();
  }

  /**
   * POST /api/evacuation-routes/calculate
   * Calculate evacuation routes for high-risk zones
   */
  async calculateRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { highRiskZones, assemblyPoints } = req.body;

      if (!highRiskZones || !Array.isArray(highRiskZones)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'highRiskZones (array) is required',
        });
        return;
      }

      // Use default assembly points if not provided
      const points: AssemblyPoint[] = assemblyPoints || this.getDefaultAssemblyPoints();

      const startTime = Date.now();
      const routes = await this.routingService.calculateRoutes(highRiskZones, points);
      const duration = Date.now() - startTime;

      logger.info(`Calculated ${routes.length} evacuation routes in ${duration}ms`);

      res.status(200).json({
        success: true,
        data: {
          routes,
          totalRoutes: routes.length,
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Calculate routes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to calculate evacuation routes',
      });
    }
  }

  /**
   * GET /api/evacuation-routes/:zoneId
   * Get evacuation routes for specific zone
   */
  async getRoutesForZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;

      if (!zoneId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'zoneId is required',
        });
        return;
      }

      // In production: Fetch from database or cache
      logger.info(`Fetching routes for zone ${zoneId}`);

      res.status(200).json({
        success: true,
        data: {
          zoneId,
          routes: [],
          message: 'Routes would be returned here',
        },
      });
    } catch (error) {
      logger.error('Get routes for zone error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get evacuation routes',
      });
    }
  }

  /**
   * POST /api/evacuation-routes/optimize
   * Optimize evacuation routes with constraints
   */
  async optimizeRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { currentRoutes, constraints } = req.body;

      if (!currentRoutes || !Array.isArray(currentRoutes)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'currentRoutes (array) is required',
        });
        return;
      }

      const startTime = Date.now();
      const optimized = await this.routingService.optimizeRoutes(currentRoutes, constraints || {});
      const duration = Date.now() - startTime;

      logger.info(`Optimized ${optimized.length} routes in ${duration}ms`);

      res.status(200).json({
        success: true,
        data: {
          routes: optimized,
          totalRoutes: optimized.length,
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Optimize routes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to optimize evacuation routes',
      });
    }
  }

  /**
   * Get default assembly points (placeholder)
   */
  private getDefaultAssemblyPoints(): AssemblyPoint[] {
    return [
      {
        id: 'ap1',
        name: 'Central Stadium',
        coordinates: [78.4867, 17.3850],
        capacity: 10000,
        facilities: ['Medical', 'Food', 'Water', 'Shelter'],
      },
      {
        id: 'ap2',
        name: 'Community Center',
        coordinates: [78.5000, 17.4000],
        capacity: 5000,
        facilities: ['Medical', 'Food', 'Water'],
      },
      {
        id: 'ap3',
        name: 'School Grounds',
        coordinates: [78.4700, 17.3700],
        capacity: 3000,
        facilities: ['Shelter', 'Water'],
      },
    ];
  }
}
