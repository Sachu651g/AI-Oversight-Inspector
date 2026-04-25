import { WeatherParameters } from '../utils/parameterValidator';
import { RiskClassificationService, Zone, RiskClassification } from './RiskClassificationService';
import redis from '../config/redis';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface SimulationFrame {
  frameNumber: number;
  timestamp: string; // T+0h to T+12h
  zoneRisks: RiskClassification[];
  affectedPopulation: number;
  infrastructureAtRisk: InfrastructureRisk[];
}

export interface InfrastructureRisk {
  type: 'hospital' | 'shelter' | 'water_treatment' | 'power_station';
  name: string;
  zoneId: string;
  riskLevel: string;
  capacity?: number;
}

export interface Simulation {
  id: string;
  weatherParams: WeatherParameters;
  frames: SimulationFrame[];
  totalAffectedPopulation: number;
  createdAt: Date;
}

export class SimulationEngineService {
  private riskService: RiskClassificationService;

  constructor() {
    this.riskService = new RiskClassificationService();
  }

  /**
   * Generate 12-frame disaster simulation
   */
  async generateSimulation(
    weatherParams: WeatherParameters,
    zones: Zone[]
  ): Promise<Simulation> {
    try {
      const simulationId = uuidv4();
      logger.info(`Starting simulation ${simulationId} for ${zones.length} zones`);

      // Check cache
      const cacheKey = `sim:${this.getParamHash(weatherParams)}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Simulation retrieved from cache');
        return cached;
      }

      // Generate initial risk classification (Frame 0)
      let currentRisks = await this.riskService.classifyZones(weatherParams, zones);

      const frames: SimulationFrame[] = [];

      // Generate 12 frames (T+0h to T+12h)
      for (let hour = 0; hour <= 12; hour++) {
        const frame: SimulationFrame = {
          frameNumber: hour,
          timestamp: `T+${hour}h`,
          zoneRisks: currentRisks,
          affectedPopulation: this.calculateAffectedPopulation(currentRisks),
          infrastructureAtRisk: this.identifyInfrastructureAtRisk(currentRisks, zones),
        };

        frames.push(frame);

        // Propagate risk to next hour (except for last frame)
        if (hour < 12) {
          currentRisks = await this.propagateRisk(currentRisks, zones, weatherParams);
        }
      }

      const simulation: Simulation = {
        id: simulationId,
        weatherParams,
        frames,
        totalAffectedPopulation: Math.max(...frames.map((f) => f.affectedPopulation)),
        createdAt: new Date(),
      };

      // Cache simulation
      await this.saveToCache(cacheKey, simulation, 3600); // 1 hour TTL

      logger.info(`Simulation ${simulationId} completed with ${frames.length} frames`);
      return simulation;
    } catch (error) {
      logger.error('Simulation generation failed:', error);
      throw error;
    }
  }

  /**
   * Propagate risk to adjacent zones over time
   */
  private async propagateRisk(
    currentRisks: RiskClassification[],
    zones: Zone[],
    weatherParams: WeatherParameters
  ): Promise<RiskClassification[]> {
    const newRisks = [...currentRisks];

    for (let i = 0; i < currentRisks.length; i++) {
      const risk = currentRisks[i];

      // High and Critical zones spread to adjacent zones
      if (risk.riskLevel === 'High' || risk.riskLevel === 'Critical') {
        const adjacentZones = this.getAdjacentZones(risk.zoneId, zones);

        for (const adjZone of adjacentZones) {
          const adjIndex = newRisks.findIndex((r) => r.zoneId === adjZone.id);
          if (adjIndex !== -1) {
            // Increase risk score by propagation factor
            const propagationFactor = this.calculatePropagationFactor(
              risk,
              newRisks[adjIndex],
              weatherParams
            );

            newRisks[adjIndex] = {
              ...newRisks[adjIndex],
              riskScore: Math.min(newRisks[adjIndex].riskScore + propagationFactor, 100),
              riskLevel: this.scoreToRiskLevel(
                Math.min(newRisks[adjIndex].riskScore + propagationFactor, 100)
              ),
            };
          }
        }
      }
    }

    return newRisks;
  }

  /**
   * Calculate propagation factor based on source risk and weather conditions
   */
  private calculatePropagationFactor(
    sourceRisk: RiskClassification,
    targetRisk: RiskClassification,
    weatherParams: WeatherParameters
  ): number {
    let factor = 0;

    // Base propagation from source risk level
    if (sourceRisk.riskLevel === 'Critical') factor = 15;
    else if (sourceRisk.riskLevel === 'High') factor = 10;

    // Weather amplification
    if (weatherParams.rainfall > 35.5) factor += 5;
    if (weatherParams.windSpeed > 70) factor += 5;
    if (weatherParams.soilMoisture > 60) factor += 5;

    // Reduce if target already high risk
    if (targetRisk.riskLevel === 'High' || targetRisk.riskLevel === 'Critical') {
      factor *= 0.5;
    }

    return factor;
  }

  /**
   * Get adjacent zones (simplified - in production, use spatial queries)
   */
  private getAdjacentZones(zoneId: string, zones: Zone[]): Zone[] {
    // Placeholder: In production, use PostGIS spatial queries
    // For now, return random 2-3 zones as "adjacent"
    const otherZones = zones.filter((z) => z.id !== zoneId);
    const adjacentCount = Math.min(3, otherZones.length);
    return otherZones.slice(0, adjacentCount);
  }

  /**
   * Calculate total affected population
   */
  private calculateAffectedPopulation(risks: RiskClassification[]): number {
    let total = 0;

    for (const risk of risks) {
      // Only count Medium, High, and Critical zones
      if (risk.riskLevel === 'Medium') {
        total += this.getZonePopulation(risk.zoneId) * 0.3; // 30% affected
      } else if (risk.riskLevel === 'High') {
        total += this.getZonePopulation(risk.zoneId) * 0.6; // 60% affected
      } else if (risk.riskLevel === 'Critical') {
        total += this.getZonePopulation(risk.zoneId) * 0.9; // 90% affected
      }
    }

    return Math.round(total);
  }

  /**
   * Identify infrastructure at risk
   */
  private identifyInfrastructureAtRisk(
    risks: RiskClassification[],
    zones: Zone[]
  ): InfrastructureRisk[] {
    const infrastructure: InfrastructureRisk[] = [];

    for (const risk of risks) {
      // Only flag infrastructure in Medium+ risk zones
      if (risk.riskLevel === 'Low') continue;

      const zone = zones.find((z) => z.id === risk.zoneId);
      if (!zone) continue;

      // Placeholder: In production, query infrastructure database
      // For now, generate sample infrastructure
      if (risk.riskLevel === 'High' || risk.riskLevel === 'Critical') {
        infrastructure.push({
          type: 'hospital',
          name: `${zone.name} General Hospital`,
          zoneId: zone.id,
          riskLevel: risk.riskLevel,
          capacity: 200,
        });

        infrastructure.push({
          type: 'shelter',
          name: `${zone.name} Emergency Shelter`,
          zoneId: zone.id,
          riskLevel: risk.riskLevel,
          capacity: 500,
        });
      }
    }

    return infrastructure;
  }

  /**
   * Get zone population (placeholder)
   */
  private getZonePopulation(zoneId: string): number {
    // Placeholder: In production, query from database
    return 50000; // Default 50k per zone
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
   * Generate parameter hash for caching
   */
  private getParamHash(params: WeatherParameters): string {
    return `${params.rainfall}-${params.windSpeed}-${params.humidity}-${params.soilMoisture}-${params.temperature}-${params.earthquakeMagnitude || 0}`;
  }

  /**
   * Cache management
   */
  private async getFromCache(key: string): Promise<Simulation | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: Simulation, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache save failed:', error);
    }
  }
}
