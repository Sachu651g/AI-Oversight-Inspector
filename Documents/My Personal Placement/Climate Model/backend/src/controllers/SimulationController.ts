import { Request, Response } from 'express';
import { SimulationEngineService } from '../services/SimulationEngineService';
import { WeatherParameters, ParameterValidator } from '../utils/parameterValidator';
import { Zone } from '../services/RiskClassificationService';
import logger from '../config/logger';

export class SimulationController {
  private simulationService: SimulationEngineService;

  constructor() {
    this.simulationService = new SimulationEngineService();
  }

  /**
   * POST /api/simulate/generate
   * Generate 12-frame disaster simulation
   */
  async generateSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { weatherParams, zoneIds } = req.body;

      // Validate request
      if (!weatherParams || !zoneIds || !Array.isArray(zoneIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'weatherParams and zoneIds (array) are required',
        });
        return;
      }

      // Validate weather parameters
      const validation = ParameterValidator.validate(weatherParams as WeatherParameters);
      if (!validation.valid) {
        res.status(400).json({
          error: 'Invalid Parameters',
          message: validation.errors.join(', '),
        });
        return;
      }

      // Get zones (placeholder)
      const zones: Zone[] = zoneIds.map((id: string) => ({
        id,
        name: `Zone ${id}`,
        population: 50000,
        elevation: 10,
        proximityToWater: 5,
        soilType: 'clay',
        buildingDensity: 0.6,
      }));

      // Generate simulation
      const startTime = Date.now();
      const simulation = await this.simulationService.generateSimulation(
        weatherParams as WeatherParameters,
        zones
      );
      const duration = Date.now() - startTime;

      logger.info(`Simulation generated in ${duration}ms: ${simulation.id}`);

      res.status(200).json({
        success: true,
        data: {
          simulationId: simulation.id,
          frames: simulation.frames,
          totalAffectedPopulation: simulation.totalAffectedPopulation,
          weatherParams: simulation.weatherParams,
          createdAt: simulation.createdAt,
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Simulation generation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate simulation',
      });
    }
  }

  /**
   * GET /api/simulate/frames/:simulationId
   * Get specific simulation frame
   */
  async getSimulationFrame(req: Request, res: Response): Promise<void> {
    try {
      const { simulationId } = req.params;
      const { frameNumber } = req.query;

      if (!simulationId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'simulationId is required',
        });
        return;
      }

      // In production: Fetch from database
      logger.info(`Fetching frame ${frameNumber} for simulation ${simulationId}`);

      res.status(200).json({
        success: true,
        data: {
          simulationId,
          frameNumber: frameNumber || 0,
          message: 'Frame data would be returned here',
        },
      });
    } catch (error) {
      logger.error('Get simulation frame error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get simulation frame',
      });
    }
  }

  /**
   * GET /api/simulate/history
   * Get simulation history
   */
  async getSimulationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10, offset = 0 } = req.query;

      // In production: Fetch from database
      logger.info(`Fetching simulation history: limit=${limit}, offset=${offset}`);

      res.status(200).json({
        success: true,
        data: {
          simulations: [],
          total: 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      logger.error('Get simulation history error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get simulation history',
      });
    }
  }
}
