import { WeatherParameters, ParameterValidator } from '../utils/parameterValidator';
import redis from '../config/redis';
import logger from '../config/logger';

export interface Zone {
  id: string;
  name: string;
  population: number;
  elevation: number;
  proximityToWater: number;
  soilType: string;
  buildingDensity: number;
}

export interface RiskClassification {
  zoneId: string;
  zoneName: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number; // 0-100
  confidence: number; // 0-100%
  timestamp: Date;
  parameters: WeatherParameters;
}

export class RiskClassificationService {
  /**
   * Classify risk for multiple zones based on weather parameters
   */
  async classifyZones(
    weatherParams: WeatherParameters,
    zones: Zone[]
  ): Promise<RiskClassification[]> {
    try {
      // Validate parameters
      const validation = ParameterValidator.validate(weatherParams);
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Check cache first
      const cacheKey = this.getCacheKey(weatherParams);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Risk classification retrieved from cache');
        return cached;
      }

      // Classify each zone
      const classifications: RiskClassification[] = [];
      for (const zone of zones) {
        const classification = await this.classifyZone(weatherParams, zone);
        classifications.push(classification);
      }

      // Cache results
      await this.saveToCache(cacheKey, classifications, 300); // 5 min TTL

      logger.info(`Risk classification completed for ${zones.length} zones`);
      return classifications;
    } catch (error) {
      logger.error('Risk classification failed:', error);
      throw error;
    }
  }

  /**
   * Classify risk for a single zone
   */
  private async classifyZone(
    weatherParams: WeatherParameters,
    zone: Zone
  ): Promise<RiskClassification> {
    // Feature engineering: combine weather + zone characteristics
    const features = this.engineerFeatures(weatherParams, zone);

    // Calculate risk score using rule-based model (XGBoost placeholder)
    const riskScore = this.calculateRiskScore(features);

    // Map score to risk level
    const riskLevel = this.scoreToRiskLevel(riskScore);

    // Calculate confidence
    const confidence = this.calculateConfidence(features, riskScore);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      riskLevel,
      riskScore,
      confidence,
      timestamp: new Date(),
      parameters: weatherParams,
    };
  }

  /**
   * Feature engineering: combine weather parameters with zone characteristics
   */
  private engineerFeatures(weatherParams: WeatherParameters, zone: Zone): Record<string, number> {
    return {
      // Weather parameters
      rainfall: weatherParams.rainfall,
      windSpeed: weatherParams.windSpeed,
      humidity: weatherParams.humidity,
      soilMoisture: weatherParams.soilMoisture,
      temperature: weatherParams.temperature,
      earthquakeMagnitude: weatherParams.earthquakeMagnitude || 0,

      // Zone characteristics
      elevation: zone.elevation,
      proximityToWater: zone.proximityToWater,
      buildingDensity: zone.buildingDensity,
      population: zone.population,

      // Interaction terms
      rainfallSoilInteraction: weatherParams.rainfall * weatherParams.soilMoisture,
      windProximityInteraction: weatherParams.windSpeed * zone.proximityToWater,
      humidityRainfallInteraction: weatherParams.humidity * weatherParams.rainfall,
    };
  }

  /**
   * Calculate risk score using rule-based model (placeholder for XGBoost)
   */
  private calculateRiskScore(features: Record<string, number>): number {
    // Weighted scoring based on IMD/WMO/NDMA thresholds
    let score = 0;

    // Rainfall contribution (weight: 0.25)
    if (features.rainfall > 64.5) score += 25;
    else if (features.rainfall > 35.5) score += 18;
    else if (features.rainfall > 7.5) score += 10;
    else score += 3;

    // Wind speed contribution (weight: 0.20)
    if (features.windSpeed > 110) score += 20;
    else if (features.windSpeed > 70) score += 15;
    else if (features.windSpeed > 40) score += 8;
    else score += 2;

    // Humidity contribution (weight: 0.15)
    if (features.humidity > 95) score += 15;
    else if (features.humidity > 80) score += 10;
    else if (features.humidity > 60) score += 5;
    else score += 1;

    // Soil moisture contribution (weight: 0.20)
    if (features.soilMoisture > 85) score += 20;
    else if (features.soilMoisture > 60) score += 15;
    else if (features.soilMoisture > 30) score += 8;
    else score += 2;

    // Temperature contribution (weight: 0.10)
    if (features.temperature > 42) score += 10;
    else if (features.temperature > 37) score += 7;
    else if (features.temperature > 25) score += 3;
    else score += 1;

    // Earthquake contribution (weight: 0.10)
    if (features.earthquakeMagnitude > 7.0) score += 10;
    else if (features.earthquakeMagnitude > 6.0) score += 7;
    else if (features.earthquakeMagnitude > 4.0) score += 4;
    else score += 0;

    // Zone vulnerability adjustments
    if (features.proximityToWater < 5) score += 5; // Within 5km of water
    if (features.elevation < 10) score += 5; // Low elevation
    if (features.buildingDensity > 0.7) score += 3; // High density

    // Interaction term adjustments
    if (features.rainfallSoilInteraction > 5000) score += 5;
    if (features.windProximityInteraction > 500) score += 5;

    // Normalize to 0-100
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Map risk score to risk level
   */
  private scoreToRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score < 25) return 'Low';
    if (score < 50) return 'Medium';
    if (score < 75) return 'High';
    return 'Critical';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(features: Record<string, number>, riskScore: number): number {
    // Higher confidence when parameters are clearly in one category
    // Lower confidence when parameters are near threshold boundaries

    let confidence = 80; // Base confidence

    // Check if parameters are near thresholds (reduces confidence)
    const nearThreshold = (value: number, thresholds: number[]) => {
      return thresholds.some((t) => Math.abs(value - t) < 2);
    };

    if (nearThreshold(features.rainfall, [7.5, 35.5, 64.5])) confidence -= 10;
    if (nearThreshold(features.windSpeed, [40, 70, 110])) confidence -= 10;
    if (nearThreshold(features.humidity, [60, 80, 95])) confidence -= 10;
    if (nearThreshold(features.soilMoisture, [30, 60, 85])) confidence -= 10;

    // Increase confidence if multiple parameters agree on risk level
    const paramLevels = [
      ParameterValidator.classifyParameter('rainfall', features.rainfall),
      ParameterValidator.classifyParameter('windSpeed', features.windSpeed),
      ParameterValidator.classifyParameter('humidity', features.humidity),
      ParameterValidator.classifyParameter('soilMoisture', features.soilMoisture),
    ];

    const uniqueLevels = new Set(paramLevels);
    if (uniqueLevels.size === 1) confidence += 15; // All agree
    else if (uniqueLevels.size === 2) confidence += 5; // Most agree

    return Math.min(Math.max(confidence, 30), 100);
  }

  /**
   * Cache management
   */
  private getCacheKey(params: WeatherParameters): string {
    return `risk:${params.rainfall}:${params.windSpeed}:${params.humidity}:${params.soilMoisture}:${params.temperature}:${params.earthquakeMagnitude || 0}`;
  }

  private async getFromCache(key: string): Promise<RiskClassification[] | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: RiskClassification[], ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache save failed:', error);
    }
  }
}
