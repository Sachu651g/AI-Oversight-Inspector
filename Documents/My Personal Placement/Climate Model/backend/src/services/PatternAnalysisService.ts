import pool from '../config/database';
import redis from '../config/redis';
import logger from '../config/logger';
import { WeatherParameters } from '../utils/parameterValidator';

export interface HistoricalPattern {
  location: string;
  latitude: number;
  longitude: number;
  month: number;
  avgRainfall: number;
  avgWindSpeed: number;
  avgHumidity: number;
  avgTemperature: number;
  disasterFrequency: number;
  lastDisasterDate: Date | null;
}

export interface PatternPrediction {
  location: string;
  predictedRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  patternMatch: number; // 0-100% how well current conditions match historical disaster patterns
  historicalDisasters: number;
  recommendation: string;
  nextAnalysisTime: Date;
  analysisTimestamp: Date;
}

export class PatternAnalysisService {
  private readonly ANALYSIS_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Analyze current conditions against historical patterns for a specific location
   */
  async analyzePatterns(
    location: string,
    latitude: number,
    longitude: number,
    currentParams: WeatherParameters
  ): Promise<PatternPrediction> {
    try {
      // Check cache first (10-minute TTL)
      const cacheKey = `pattern:${location}:${latitude}:${longitude}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Pattern analysis retrieved from cache for ${location}`);
        return cached;
      }

      // Get historical patterns for this location
      const historicalData = await this.getHistoricalPatterns(latitude, longitude);

      // Get current month patterns
      const currentMonth = new Date().getMonth() + 1;
      const monthlyPattern = historicalData.find((p) => p.month === currentMonth);

      // Calculate pattern match score
      const patternMatch = this.calculatePatternMatch(currentParams, monthlyPattern);

      // Get historical disaster count
      const disasterCount = await this.getHistoricalDisasterCount(latitude, longitude);

      // Predict risk level based on pattern analysis
      const predictedRiskLevel = this.predictRiskFromPattern(
        patternMatch,
        disasterCount,
        currentParams
      );

      // Calculate confidence based on data quality
      const confidence = this.calculatePatternConfidence(historicalData.length, patternMatch);

      // Generate recommendation
      const recommendation = this.generateRecommendation(
        predictedRiskLevel,
        patternMatch,
        disasterCount
      );

      const prediction: PatternPrediction = {
        location,
        predictedRiskLevel,
        confidence,
        patternMatch,
        historicalDisasters: disasterCount,
        recommendation,
        nextAnalysisTime: new Date(Date.now() + this.ANALYSIS_INTERVAL_MS),
        analysisTimestamp: new Date(),
      };

      // Cache for 10 minutes
      await this.saveToCache(cacheKey, prediction, 600);

      logger.info(`Pattern analysis completed for ${location} - Risk: ${predictedRiskLevel}`);
      return prediction;
    } catch (error) {
      logger.error('Pattern analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get historical climate patterns for a location (within 50km radius)
   */
  private async getHistoricalPatterns(
    latitude: number,
    longitude: number
  ): Promise<HistoricalPattern[]> {
    try {
      // Query historical data from database
      // Using PostGIS for geospatial queries
      const query = `
        SELECT 
          location_name as location,
          latitude,
          longitude,
          EXTRACT(MONTH FROM recorded_date) as month,
          AVG(rainfall) as avg_rainfall,
          AVG(wind_speed) as avg_wind_speed,
          AVG(humidity) as avg_humidity,
          AVG(temperature) as avg_temperature,
          COUNT(CASE WHEN disaster_occurred = true THEN 1 END) as disaster_frequency,
          MAX(CASE WHEN disaster_occurred = true THEN recorded_date END) as last_disaster_date
        FROM historical_climate_data
        WHERE ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($1, $2)::geography,
          50000  -- 50km radius
        )
        AND recorded_date >= NOW() - INTERVAL '5 years'
        GROUP BY location_name, latitude, longitude, EXTRACT(MONTH FROM recorded_date)
        ORDER BY month;
      `;

      const result = await pool.query(query, [longitude, latitude]);

      return result.rows.map((row) => ({
        location: row.location,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        month: parseInt(row.month),
        avgRainfall: parseFloat(row.avg_rainfall),
        avgWindSpeed: parseFloat(row.avg_wind_speed),
        avgHumidity: parseFloat(row.avg_humidity),
        avgTemperature: parseFloat(row.avg_temperature),
        disasterFrequency: parseInt(row.disaster_frequency),
        lastDisasterDate: row.last_disaster_date ? new Date(row.last_disaster_date) : null,
      }));
    } catch (error) {
      logger.error('Failed to fetch historical patterns:', error);
      // Return mock data for demo if database fails
      return this.getMockHistoricalData();
    }
  }

  /**
   * Calculate how well current conditions match historical disaster patterns
   */
  private calculatePatternMatch(
    current: WeatherParameters,
    historical: HistoricalPattern | undefined
  ): number {
    if (!historical) {
      // No historical data - use current parameters to estimate
      return this.estimatePatternMatchFromCurrent(current);
    }

    // Calculate deviation from historical averages
    const rainfallDev = Math.abs(current.rainfall - historical.avgRainfall) / historical.avgRainfall;
    const windDev = Math.abs(current.windSpeed - historical.avgWindSpeed) / historical.avgWindSpeed;
    const humidityDev = Math.abs(current.humidity - historical.avgHumidity) / historical.avgHumidity;
    const tempDev = Math.abs(current.temperature - historical.avgTemperature) / historical.avgTemperature;

    // Higher deviation = higher pattern match (unusual conditions)
    const avgDeviation = (rainfallDev + windDev + humidityDev + tempDev) / 4;

    // Convert to 0-100 scale
    const patternMatch = Math.min(avgDeviation * 100, 100);

    // Boost score if disaster frequency is high
    if (historical.disasterFrequency > 5) {
      return Math.min(patternMatch * 1.2, 100);
    }

    return patternMatch;
  }

  /**
   * Estimate pattern match when no historical data available
   */
  private estimatePatternMatchFromCurrent(current: WeatherParameters): number {
    let score = 0;

    // Extreme rainfall
    if (current.rainfall > 100) score += 30;
    else if (current.rainfall > 64.5) score += 20;
    else if (current.rainfall > 35.5) score += 10;

    // Extreme wind
    if (current.windSpeed > 110) score += 25;
    else if (current.windSpeed > 70) score += 15;
    else if (current.windSpeed > 40) score += 8;

    // High humidity + rainfall combination
    if (current.humidity > 90 && current.rainfall > 50) score += 20;

    // Soil saturation
    if (current.soilMoisture > 85) score += 15;

    // Earthquake
    if (current.earthquakeMagnitude && current.earthquakeMagnitude > 5.0) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Get historical disaster count for location
   */
  private async getHistoricalDisasterCount(
    latitude: number,
    longitude: number
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as disaster_count
        FROM historical_disasters
        WHERE ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($1, $2)::geography,
          50000  -- 50km radius
        )
        AND disaster_date >= NOW() - INTERVAL '10 years';
      `;

      const result = await pool.query(query, [longitude, latitude]);
      return parseInt(result.rows[0]?.disaster_count || '0');
    } catch (error) {
      logger.error('Failed to fetch disaster count:', error);
      return 0;
    }
  }

  /**
   * Predict risk level from pattern analysis
   */
  private predictRiskFromPattern(
    patternMatch: number,
    disasterCount: number,
    current: WeatherParameters
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    // Combine pattern match with disaster history
    let riskScore = patternMatch;

    // Adjust based on disaster history
    if (disasterCount > 10) riskScore += 15;
    else if (disasterCount > 5) riskScore += 10;
    else if (disasterCount > 2) riskScore += 5;

    // Adjust based on current extreme conditions
    if (current.rainfall > 100 || current.windSpeed > 110) riskScore += 20;
    if (current.earthquakeMagnitude && current.earthquakeMagnitude > 6.0) riskScore += 25;

    // Map to risk level
    if (riskScore >= 75) return 'Critical';
    if (riskScore >= 50) return 'High';
    if (riskScore >= 25) return 'Medium';
    return 'Low';
  }

  /**
   * Calculate confidence in pattern prediction
   */
  private calculatePatternConfidence(dataPoints: number, patternMatch: number): number {
    let confidence = 50; // Base confidence

    // More historical data = higher confidence
    if (dataPoints >= 60) confidence += 30; // 5 years of monthly data
    else if (dataPoints >= 36) confidence += 20; // 3 years
    else if (dataPoints >= 12) confidence += 10; // 1 year
    else confidence -= 20; // Limited data

    // Strong pattern match = higher confidence
    if (patternMatch > 80) confidence += 15;
    else if (patternMatch > 60) confidence += 10;
    else if (patternMatch > 40) confidence += 5;

    return Math.min(Math.max(confidence, 30), 95);
  }

  /**
   * Generate actionable recommendation
   */
  private generateRecommendation(
    riskLevel: string,
    patternMatch: number,
    disasterCount: number
  ): string {
    if (riskLevel === 'Critical') {
      return `IMMEDIATE ACTION REQUIRED: Current conditions match ${patternMatch.toFixed(0)}% of historical disaster patterns. This area has experienced ${disasterCount} disasters in the past 10 years. Initiate evacuation protocols immediately.`;
    }

    if (riskLevel === 'High') {
      return `HIGH ALERT: Pattern analysis shows ${patternMatch.toFixed(0)}% match with disaster conditions. Historical data shows ${disasterCount} past events. Prepare evacuation resources and issue public advisory.`;
    }

    if (riskLevel === 'Medium') {
      return `ADVISORY: Conditions show ${patternMatch.toFixed(0)}% similarity to historical risk patterns. Monitor situation closely. ${disasterCount} historical events recorded in this area.`;
    }

    return `NORMAL: Current conditions within normal parameters. Pattern match: ${patternMatch.toFixed(0)}%. Continue routine monitoring.`;
  }

  /**
   * Mock historical data for demo
   */
  private getMockHistoricalData(): HistoricalPattern[] {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((month) => ({
      location: 'Chennai District',
      latitude: 13.0827,
      longitude: 80.2707,
      month,
      avgRainfall: month >= 10 && month <= 12 ? 150 : 50, // Northeast monsoon
      avgWindSpeed: month >= 6 && month <= 9 ? 45 : 25, // Southwest monsoon
      avgHumidity: month >= 6 && month <= 12 ? 85 : 70,
      avgTemperature: month >= 3 && month <= 6 ? 35 : 28,
      disasterFrequency: month >= 10 && month <= 12 ? 3 : 1,
      lastDisasterDate: month >= 10 ? new Date('2023-11-15') : null,
    }));
  }

  /**
   * Cache management
   */
  private async getFromCache(key: string): Promise<PatternPrediction | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: PatternPrediction, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache save failed:', error);
    }
  }

  /**
   * Schedule auto-refresh for pattern analysis
   */
  async scheduleAutoRefresh(
    location: string,
    latitude: number,
    longitude: number,
    currentParams: WeatherParameters
  ): Promise<NodeJS.Timeout> {
    logger.info(`Scheduling auto-refresh for ${location} every 10 minutes`);

    return setInterval(async () => {
      try {
        logger.info(`Auto-refreshing pattern analysis for ${location}`);
        await this.analyzePatterns(location, latitude, longitude, currentParams);
      } catch (error) {
        logger.error(`Auto-refresh failed for ${location}:`, error);
      }
    }, this.ANALYSIS_INTERVAL_MS);
  }
}
