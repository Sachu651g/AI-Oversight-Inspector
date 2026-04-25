import { Request, Response } from 'express';
import { PatternAnalysisService } from '../services/PatternAnalysisService';
import { WeatherParameters } from '../utils/parameterValidator';
import logger from '../config/logger';

export class PatternAnalysisController {
  private patternService: PatternAnalysisService;
  private refreshIntervals: Map<string, NodeJS.Timeout>;

  constructor() {
    this.patternService = new PatternAnalysisService();
    this.refreshIntervals = new Map();
  }

  /**
   * POST /api/pattern/analyze
   * Analyze patterns for a specific location
   */
  async analyzeLocation(req: Request, res: Response): Promise<void> {
    try {
      const { location, latitude, longitude, weatherParameters } = req.body;

      if (!location || !latitude || !longitude || !weatherParameters) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'location, latitude, longitude, and weatherParameters are required',
        });
        return;
      }

      const params: WeatherParameters = {
        rainfall: weatherParameters.rainfall || 0,
        windSpeed: weatherParameters.windSpeed || 0,
        humidity: weatherParameters.humidity || 0,
        soilMoisture: weatherParameters.soilMoisture || 0,
        temperature: weatherParameters.temperature || 0,
        earthquakeMagnitude: weatherParameters.earthquakeMagnitude || 0,
      };

      const prediction = await this.patternService.analyzePatterns(
        location,
        parseFloat(latitude),
        parseFloat(longitude),
        params
      );

      logger.info(`Pattern analysis completed for ${location}`);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      logger.error('Pattern analysis error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to analyze patterns',
      });
    }
  }

  /**
   * POST /api/pattern/auto-refresh/start
   * Start auto-refresh for a location (every 10 minutes)
   */
  async startAutoRefresh(req: Request, res: Response): Promise<void> {
    try {
      const { location, latitude, longitude, weatherParameters } = req.body;

      if (!location || !latitude || !longitude || !weatherParameters) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'location, latitude, longitude, and weatherParameters are required',
        });
        return;
      }

      // Stop existing interval if any
      const existingInterval = this.refreshIntervals.get(location);
      if (existingInterval) {
        clearInterval(existingInterval);
        logger.info(`Stopped existing auto-refresh for ${location}`);
      }

      const params: WeatherParameters = {
        rainfall: weatherParameters.rainfall || 0,
        windSpeed: weatherParameters.windSpeed || 0,
        humidity: weatherParameters.humidity || 0,
        soilMoisture: weatherParameters.soilMoisture || 0,
        temperature: weatherParameters.temperature || 0,
        earthquakeMagnitude: weatherParameters.earthquakeMagnitude || 0,
      };

      // Start new interval
      const interval = await this.patternService.scheduleAutoRefresh(
        location,
        parseFloat(latitude),
        parseFloat(longitude),
        params
      );

      this.refreshIntervals.set(location, interval);

      logger.info(`Started auto-refresh for ${location} - every 10 minutes`);

      res.status(200).json({
        success: true,
        message: `Auto-refresh started for ${location}. Analysis will run every 10 minutes.`,
        data: {
          location,
          refreshInterval: '10 minutes',
          nextRefresh: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } catch (error) {
      logger.error('Start auto-refresh error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to start auto-refresh',
      });
    }
  }

  /**
   * POST /api/pattern/auto-refresh/stop
   * Stop auto-refresh for a location
   */
  async stopAutoRefresh(req: Request, res: Response): Promise<void> {
    try {
      const { location } = req.body;

      if (!location) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'location is required',
        });
        return;
      }

      const interval = this.refreshIntervals.get(location);
      if (interval) {
        clearInterval(interval);
        this.refreshIntervals.delete(location);
        logger.info(`Stopped auto-refresh for ${location}`);

        res.status(200).json({
          success: true,
          message: `Auto-refresh stopped for ${location}`,
        });
      } else {
        res.status(404).json({
          error: 'Not Found',
          message: `No active auto-refresh found for ${location}`,
        });
      }
    } catch (error) {
      logger.error('Stop auto-refresh error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to stop auto-refresh',
      });
    }
  }

  /**
   * GET /api/pattern/auto-refresh/status
   * Get status of all active auto-refresh intervals
   */
  async getAutoRefreshStatus(req: Request, res: Response): Promise<void> {
    try {
      const activeLocations = Array.from(this.refreshIntervals.keys());

      res.status(200).json({
        success: true,
        data: {
          activeLocations,
          count: activeLocations.length,
          refreshInterval: '10 minutes',
        },
      });
    } catch (error) {
      logger.error('Get auto-refresh status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get auto-refresh status',
      });
    }
  }
}
