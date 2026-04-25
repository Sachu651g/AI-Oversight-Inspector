import { RiskClassification } from './RiskClassificationService';
import redis from '../config/redis';
import logger from '../config/logger';

export interface EvacuationRoute {
  id: string;
  zoneId: string;
  zoneName: string;
  assemblyPointId: string;
  assemblyPointName: string;
  distance: number; // km
  estimatedTime: number; // minutes
  capacity: number; // people
  status: 'Open' | 'Congested' | 'Closed';
  equityScore: number; // 0-100
  routeGeometry: any; // GeoJSON LineString
  turnByTurnDirections: string[];
}

export interface AssemblyPoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  facilities: string[];
}

export class EvacuationRoutingService {
  /**
   * Calculate evacuation routes for high-risk zones
   */
  async calculateRoutes(
    highRiskZones: RiskClassification[],
    assemblyPoints: AssemblyPoint[]
  ): Promise<EvacuationRoute[]> {
    try {
      logger.info(`Calculating routes for ${highRiskZones.length} high-risk zones`);

      // Check cache
      const cacheKey = `routes:${this.getZoneHash(highRiskZones)}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Evacuation routes retrieved from cache');
        return cached;
      }

      const allRoutes: EvacuationRoute[] = [];

      for (const zone of highRiskZones) {
        // Calculate 3 alternative routes for each zone
        const routes = await this.calculateRoutesForZone(zone, assemblyPoints);
        allRoutes.push(...routes);
      }

      // Cache routes for 30 minutes
      await this.saveToCache(cacheKey, allRoutes, 1800);

      logger.info(`Generated ${allRoutes.length} evacuation routes`);
      return allRoutes;
    } catch (error) {
      logger.error('Route calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate routes for a single zone
   */
  private async calculateRoutesForZone(
    zone: RiskClassification,
    assemblyPoints: AssemblyPoint[]
  ): Promise<EvacuationRoute[]> {
    const routes: EvacuationRoute[] = [];

    // Get vulnerability score for equity weighting
    const vulnerabilityScore = await this.getVulnerabilityScore(zone.zoneId);

    // Find 3 nearest assembly points
    const nearestPoints = this.findNearestAssemblyPoints(zone, assemblyPoints, 3);

    for (let i = 0; i < nearestPoints.length; i++) {
      const point = nearestPoints[i];

      // Calculate route using simplified Dijkstra
      const route = this.calculateRoute(zone, point, vulnerabilityScore, i);

      routes.push(route);
    }

    // Sort by equity score (prioritize vulnerable populations)
    routes.sort((a, b) => b.equityScore - a.equityScore);

    return routes;
  }

  /**
   * Calculate single route (simplified Dijkstra)
   */
  private calculateRoute(
    zone: RiskClassification,
    assemblyPoint: AssemblyPoint,
    vulnerabilityScore: number,
    routeIndex: number
  ): EvacuationRoute {
    // Simplified route calculation (in production, use real routing engine)
    const distance = this.calculateDistance(zone, assemblyPoint);
    const estimatedTime = this.calculateTravelTime(distance, zone.riskLevel);
    const capacity = this.calculateRouteCapacity(distance);
    const equityScore = this.calculateEquityScore(vulnerabilityScore, distance, estimatedTime);

    return {
      id: `route-${zone.zoneId}-${assemblyPoint.id}-${routeIndex}`,
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      assemblyPointId: assemblyPoint.id,
      assemblyPointName: assemblyPoint.name,
      distance,
      estimatedTime,
      capacity,
      status: this.determineRouteStatus(zone.riskLevel, distance),
      equityScore,
      routeGeometry: this.generateRouteGeometry(zone, assemblyPoint),
      turnByTurnDirections: this.generateDirections(zone, assemblyPoint),
    };
  }

  /**
   * Find nearest assembly points
   */
  private findNearestAssemblyPoints(
    zone: RiskClassification,
    assemblyPoints: AssemblyPoint[],
    count: number
  ): AssemblyPoint[] {
    // Simplified: return first N points (in production, use spatial queries)
    return assemblyPoints.slice(0, Math.min(count, assemblyPoints.length));
  }

  /**
   * Calculate distance (simplified)
   */
  private calculateDistance(zone: RiskClassification, point: AssemblyPoint): number {
    // Simplified: random distance 5-20 km (in production, use real routing)
    return Math.random() * 15 + 5;
  }

  /**
   * Calculate travel time
   */
  private calculateTravelTime(distance: number, riskLevel: string): number {
    // Base speed: 30 km/h
    let speed = 30;

    // Reduce speed for higher risk (congestion, panic)
    if (riskLevel === 'Critical') speed = 15;
    else if (riskLevel === 'High') speed = 20;

    return Math.round((distance / speed) * 60); // minutes
  }

  /**
   * Calculate route capacity
   */
  private calculateRouteCapacity(distance: number): number {
    // Longer routes have lower capacity (more time per trip)
    const baseCapacity = 5000;
    const distanceFactor = Math.max(0.5, 1 - distance / 50);
    return Math.round(baseCapacity * distanceFactor);
  }

  /**
   * Calculate equity score (prioritize vulnerable populations)
   */
  private calculateEquityScore(
    vulnerabilityScore: number,
    distance: number,
    estimatedTime: number
  ): number {
    // Equity score = 40% vulnerability + 30% proximity + 30% time
    const vulnerabilityComponent = vulnerabilityScore * 0.4;
    const proximityComponent = Math.max(0, 100 - distance * 5) * 0.3;
    const timeComponent = Math.max(0, 100 - estimatedTime) * 0.3;

    return Math.round(vulnerabilityComponent + proximityComponent + timeComponent);
  }

  /**
   * Determine route status
   */
  private determineRouteStatus(riskLevel: string, distance: number): 'Open' | 'Congested' | 'Closed' {
    if (riskLevel === 'Critical' && distance < 10) return 'Congested';
    if (riskLevel === 'Critical' && distance > 20) return 'Closed';
    return 'Open';
  }

  /**
   * Generate route geometry (GeoJSON)
   */
  private generateRouteGeometry(zone: RiskClassification, point: AssemblyPoint): any {
    // Simplified: straight line (in production, use real routing)
    return {
      type: 'LineString',
      coordinates: [
        [78.4867, 17.3850], // Zone coordinates (placeholder)
        point.coordinates,
      ],
    };
  }

  /**
   * Generate turn-by-turn directions
   */
  private generateDirections(zone: RiskClassification, point: AssemblyPoint): string[] {
    return [
      `Start from ${zone.zoneName}`,
      'Head north on Main Road',
      'Turn right onto Highway 44',
      'Continue for 5 km',
      'Turn left onto Assembly Point Road',
      `Arrive at ${point.name}`,
    ];
  }

  /**
   * Get vulnerability score for zone
   */
  private async getVulnerabilityScore(zoneId: string): Promise<number> {
    // Check cache
    const cacheKey = `vuln:${zoneId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    // Simplified: random score (in production, calculate from demographics)
    const score = Math.random() * 40 + 30; // 30-70 range

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, score.toString());

    return score;
  }

  /**
   * Optimize routes (recalculate with constraints)
   */
  async optimizeRoutes(
    currentRoutes: EvacuationRoute[],
    constraints: {
      avoidZones?: string[];
      maxDistance?: number;
      minCapacity?: number;
    }
  ): Promise<EvacuationRoute[]> {
    logger.info('Optimizing routes with constraints:', constraints);

    // Filter routes based on constraints
    let optimized = currentRoutes.filter((route) => {
      if (constraints.avoidZones && constraints.avoidZones.includes(route.zoneId)) {
        return false;
      }
      if (constraints.maxDistance && route.distance > constraints.maxDistance) {
        return false;
      }
      if (constraints.minCapacity && route.capacity < constraints.minCapacity) {
        return false;
      }
      return true;
    });

    // Re-sort by equity score
    optimized.sort((a, b) => b.equityScore - a.equityScore);

    logger.info(`Optimized ${optimized.length} routes`);
    return optimized;
  }

  /**
   * Generate zone hash for caching
   */
  private getZoneHash(zones: RiskClassification[]): string {
    return zones.map((z) => z.zoneId).join('-');
  }

  /**
   * Cache management
   */
  private async getFromCache(key: string): Promise<EvacuationRoute[] | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: EvacuationRoute[], ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache save failed:', error);
    }
  }
}
