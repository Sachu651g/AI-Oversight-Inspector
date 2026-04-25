import { Request, Response } from 'express';
import { RiskClassificationService, Zone } from '../services/RiskClassificationService';
import { WeatherParameters, ParameterValidator } from '../utils/parameterValidator';
import logger from '../config/logger';

export class RiskController {
  private riskService: RiskClassificationService;

  constructor() {
    this.riskService = new RiskClassificationService();
  }

  /**
   * POST /api/risk/classify
   * Classify risk for multiple zones
   */
  async classifyRisk(req: Request, res: Response): Promise<void> {
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

      // Get zones (placeholder - in production, fetch from database)
      const zones: Zone[] = zoneIds.map((id: string) => ({
        id,
        name: `Zone ${id}`,
        population: 50000,
        elevation: 10,
        proximityToWater: 5,
        soilType: 'clay',
        buildingDensity: 0.6,
      }));

      // Classify risk
      const startTime = Date.now();
      const classifications = await this.riskService.classifyZones(
        weatherParams as WeatherParameters,
        zones
      );
      const duration = Date.now() - startTime;

      logger.info(`Risk classification completed in ${duration}ms for ${zones.length} zones`);

      res.status(200).json({
        success: true,
        data: {
          zones: classifications,
          summary: {
            totalZones: classifications.length,
            low: classifications.filter((c) => c.riskLevel === 'Low').length,
            medium: classifications.filter((c) => c.riskLevel === 'Medium').length,
            high: classifications.filter((c) => c.riskLevel === 'High').length,
            critical: classifications.filter((c) => c.riskLevel === 'Critical').length,
          },
          processingTime: `${duration}ms`,
        },
      });
    } catch (error) {
      logger.error('Risk classification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to classify risk',
      });
    }
  }

  /**
   * POST /api/risk/update
   * Update weather parameters
   */
  async updateParameters(req: Request, res: Response): Promise<void> {
    try {
      const { weatherParams } = req.body;

      if (!weatherParams) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'weatherParams is required',
        });
        return;
      }

      // Validate parameters
      const validation = ParameterValidator.validate(weatherParams as WeatherParameters);
      if (!validation.valid) {
        res.status(400).json({
          error: 'Invalid Parameters',
          message: validation.errors.join(', '),
        });
        return;
      }

      // In production: Save to database, trigger alerts if thresholds exceeded
      logger.info('Weather parameters updated:', weatherParams);

      res.status(200).json({
        success: true,
        data: {
          updated: true,
          timestamp: new Date().toISOString(),
          parameters: weatherParams,
        },
      });
    } catch (error) {
      logger.error('Parameter update error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update parameters',
      });
    }
  }

  /**
   * GET /api/risk/parameters
   * Get current weather parameters
   */
  async getParameters(req: Request, res: Response): Promise<void> {
    try {
      // In production: Fetch from database or external API
      const mockParams: WeatherParameters = {
        rainfall: 12.0,
        windSpeed: 35,
        humidity: 65,
        soilMoisture: 40,
        temperature: 32,
        earthquakeMagnitude: 2.0,
      };

      res.status(200).json({
        success: true,
        data: {
          parameters: mockParams,
          timestamp: new Date().toISOString(),
          classifications: {
            rainfall: ParameterValidator.classifyParameter('rainfall', mockParams.rainfall),
            windSpeed: ParameterValidator.classifyParameter('windSpeed', mockParams.windSpeed),
            humidity: ParameterValidator.classifyParameter('humidity', mockParams.humidity),
            soilMoisture: ParameterValidator.classifyParameter('soilMoisture', mockParams.soilMoisture),
            temperature: ParameterValidator.classifyParameter('temperature', mockParams.temperature),
            earthquakeMagnitude: mockParams.earthquakeMagnitude
              ? ParameterValidator.classifyParameter('earthquakeMagnitude', mockParams.earthquakeMagnitude)
              : 'N/A',
          },
        },
      });
    } catch (error) {
      logger.error('Get parameters error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get parameters',
      });
    }
  }
}
