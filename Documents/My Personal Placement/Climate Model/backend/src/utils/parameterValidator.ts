/**
 * Parameter Validator
 * Validates weather parameters against IMD/WMO/NDMA/USGS thresholds
 */

export interface WeatherParameters {
  rainfall: number; // mm/hr
  windSpeed: number; // km/h
  humidity: number; // % RH
  soilMoisture: number; // % VWC
  temperature: number; // °C
  earthquakeMagnitude?: number; // Mw (optional)
}

export interface ParameterValidationResult {
  valid: boolean;
  errors: string[];
}

export class ParameterValidator {
  private static readonly RANGES = {
    rainfall: { min: 0, max: 300, unit: 'mm/hr' },
    windSpeed: { min: 0, max: 200, unit: 'km/h' },
    humidity: { min: 0, max: 100, unit: '% RH' },
    soilMoisture: { min: 0, max: 100, unit: '% VWC' },
    temperature: { min: 15, max: 45, unit: '°C' },
    earthquakeMagnitude: { min: 0, max: 10, unit: 'Mw' },
  };

  static validate(params: WeatherParameters): ParameterValidationResult {
    const errors: string[] = [];

    // Validate rainfall
    if (!this.isInRange(params.rainfall, this.RANGES.rainfall.min, this.RANGES.rainfall.max)) {
      errors.push(
        `Rainfall must be between ${this.RANGES.rainfall.min}-${this.RANGES.rainfall.max} ${this.RANGES.rainfall.unit}. Received: ${params.rainfall}`
      );
    }

    // Validate wind speed
    if (!this.isInRange(params.windSpeed, this.RANGES.windSpeed.min, this.RANGES.windSpeed.max)) {
      errors.push(
        `Wind speed must be between ${this.RANGES.windSpeed.min}-${this.RANGES.windSpeed.max} ${this.RANGES.windSpeed.unit}. Received: ${params.windSpeed}`
      );
    }

    // Validate humidity
    if (!this.isInRange(params.humidity, this.RANGES.humidity.min, this.RANGES.humidity.max)) {
      errors.push(
        `Humidity must be between ${this.RANGES.humidity.min}-${this.RANGES.humidity.max} ${this.RANGES.humidity.unit}. Received: ${params.humidity}`
      );
    }

    // Validate soil moisture
    if (!this.isInRange(params.soilMoisture, this.RANGES.soilMoisture.min, this.RANGES.soilMoisture.max)) {
      errors.push(
        `Soil moisture must be between ${this.RANGES.soilMoisture.min}-${this.RANGES.soilMoisture.max} ${this.RANGES.soilMoisture.unit}. Received: ${params.soilMoisture}`
      );
    }

    // Validate temperature
    if (!this.isInRange(params.temperature, this.RANGES.temperature.min, this.RANGES.temperature.max)) {
      errors.push(
        `Temperature must be between ${this.RANGES.temperature.min}-${this.RANGES.temperature.max} ${this.RANGES.temperature.unit}. Received: ${params.temperature}`
      );
    }

    // Validate earthquake magnitude (optional)
    if (params.earthquakeMagnitude !== undefined) {
      if (!this.isInRange(params.earthquakeMagnitude, this.RANGES.earthquakeMagnitude.min, this.RANGES.earthquakeMagnitude.max)) {
        errors.push(
          `Earthquake magnitude must be between ${this.RANGES.earthquakeMagnitude.min}-${this.RANGES.earthquakeMagnitude.max} ${this.RANGES.earthquakeMagnitude.unit}. Received: ${params.earthquakeMagnitude}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Classify parameter into risk level based on IMD/WMO/NDMA/USGS thresholds
   */
  static classifyParameter(paramName: keyof WeatherParameters, value: number): string {
    const thresholds: Record<string, { low: number; medium: number; high: number }> = {
      rainfall: { low: 7.5, medium: 35.5, high: 64.5 },
      windSpeed: { low: 40, medium: 70, high: 110 },
      humidity: { low: 60, medium: 80, high: 95 },
      soilMoisture: { low: 30, medium: 60, high: 85 },
      temperature: { low: 25, medium: 37, high: 42 },
      earthquakeMagnitude: { low: 4.0, medium: 5.9, high: 7.0 },
    };

    const threshold = thresholds[paramName];
    if (!threshold) return 'Unknown';

    if (value < threshold.low) return 'Low';
    if (value < threshold.medium) return 'Medium';
    if (value < threshold.high) return 'High';
    return 'Critical';
  }
}
