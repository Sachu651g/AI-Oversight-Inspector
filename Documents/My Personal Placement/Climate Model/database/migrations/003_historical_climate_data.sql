-- Migration: Historical Climate Data Tables
-- Purpose: Store historical climate data and disaster records for pattern analysis

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Historical Climate Data Table
CREATE TABLE IF NOT EXISTS historical_climate_data (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_date TIMESTAMP NOT NULL,
  rainfall DECIMAL(6, 2) NOT NULL DEFAULT 0,
  wind_speed DECIMAL(6, 2) NOT NULL DEFAULT 0,
  humidity DECIMAL(5, 2) NOT NULL DEFAULT 0,
  soil_moisture DECIMAL(5, 2) NOT NULL DEFAULT 0,
  temperature DECIMAL(5, 2) NOT NULL DEFAULT 0,
  earthquake_magnitude DECIMAL(3, 1) DEFAULT NULL,
  disaster_occurred BOOLEAN DEFAULT FALSE,
  disaster_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX idx_historical_climate_location 
ON historical_climate_data USING GIST (ST_MakePoint(longitude, latitude));

-- Create index on recorded_date for time-based queries
CREATE INDEX idx_historical_climate_date 
ON historical_climate_data (recorded_date DESC);

-- Create index on disaster_occurred for filtering
CREATE INDEX idx_historical_climate_disaster 
ON historical_climate_data (disaster_occurred) 
WHERE disaster_occurred = TRUE;

-- Historical Disasters Table
CREATE TABLE IF NOT EXISTS historical_disasters (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  disaster_date TIMESTAMP NOT NULL,
  disaster_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  casualties INTEGER DEFAULT 0,
  affected_population INTEGER DEFAULT 0,
  economic_loss DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for disaster location queries
CREATE INDEX idx_historical_disasters_location 
ON historical_disasters USING GIST (ST_MakePoint(longitude, latitude));

-- Create index on disaster_date
CREATE INDEX idx_historical_disasters_date 
ON historical_disasters (disaster_date DESC);

-- Create index on disaster_type
CREATE INDEX idx_historical_disasters_type 
ON historical_disasters (disaster_type);

-- Pattern Analysis Cache Table
CREATE TABLE IF NOT EXISTS pattern_analysis_cache (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  analysis_timestamp TIMESTAMP NOT NULL,
  predicted_risk_level VARCHAR(20) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL,
  pattern_match DECIMAL(5, 2) NOT NULL,
  historical_disasters INTEGER NOT NULL,
  recommendation TEXT,
  next_analysis_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for cache lookups
CREATE INDEX idx_pattern_cache_location 
ON pattern_analysis_cache (location_name, latitude, longitude);

-- Create index on analysis_timestamp
CREATE INDEX idx_pattern_cache_timestamp 
ON pattern_analysis_cache (analysis_timestamp DESC);

-- Insert sample historical data for Chennai (for demo purposes)
INSERT INTO historical_climate_data (
  location_name, latitude, longitude, recorded_date,
  rainfall, wind_speed, humidity, soil_moisture, temperature,
  disaster_occurred, disaster_type
) VALUES
-- 2023 Northeast Monsoon (October-December) - High rainfall period
('Chennai', 13.0827, 80.2707, '2023-10-15 10:00:00', 85.5, 45.0, 88.0, 75.0, 30.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2023-11-10 14:00:00', 120.0, 55.0, 92.0, 85.0, 28.0, TRUE, 'Flood'),
('Chennai', 13.0827, 80.2707, '2023-11-15 08:00:00', 150.0, 60.0, 95.0, 90.0, 27.0, TRUE, 'Flood'),
('Chennai', 13.0827, 80.2707, '2023-12-05 12:00:00', 95.0, 50.0, 90.0, 80.0, 29.0, FALSE, NULL),

-- 2024 Summer (March-June) - High temperature period
('Chennai', 13.0827, 80.2707, '2024-03-20 15:00:00', 10.0, 25.0, 65.0, 30.0, 38.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-04-15 14:00:00', 5.0, 30.0, 60.0, 25.0, 40.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-05-10 13:00:00', 15.0, 35.0, 70.0, 35.0, 42.0, TRUE, 'Heatwave'),
('Chennai', 13.0827, 80.2707, '2024-06-05 12:00:00', 20.0, 40.0, 75.0, 40.0, 39.0, FALSE, NULL),

-- 2024 Southwest Monsoon (June-September) - Moderate rainfall
('Chennai', 13.0827, 80.2707, '2024-07-15 10:00:00', 45.0, 45.0, 85.0, 65.0, 32.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-08-20 11:00:00', 55.0, 50.0, 88.0, 70.0, 31.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-09-10 09:00:00', 40.0, 42.0, 82.0, 60.0, 33.0, FALSE, NULL),

-- 2024 Northeast Monsoon (October-December) - Current period
('Chennai', 13.0827, 80.2707, '2024-10-20 10:00:00', 90.0, 48.0, 90.0, 78.0, 29.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-11-05 14:00:00', 110.0, 52.0, 93.0, 82.0, 28.0, FALSE, NULL),
('Chennai', 13.0827, 80.2707, '2024-12-01 08:00:00', 75.0, 46.0, 87.0, 72.0, 30.0, FALSE, NULL);

-- Insert sample historical disasters for Chennai
INSERT INTO historical_disasters (
  location_name, latitude, longitude, disaster_date,
  disaster_type, severity, casualties, affected_population, economic_loss, description, source
) VALUES
('Chennai', 13.0827, 80.2707, '2015-11-15 00:00:00', 'Flood', 'Critical', 500, 1800000, 20000.00, 
 'Chennai floods - 100-year flood event. Heaviest rainfall in over a century.', 'IMD'),
 
('Chennai', 13.0827, 80.2707, '2021-11-10 00:00:00', 'Flood', 'High', 15, 250000, 5000.00, 
 'Northeast monsoon flooding in low-lying areas.', 'NDMA'),
 
('Chennai', 13.0827, 80.2707, '2023-11-15 00:00:00', 'Flood', 'High', 8, 180000, 3500.00, 
 'Cyclone-induced flooding during northeast monsoon.', 'IMD'),
 
('Chennai', 13.0827, 80.2707, '2024-05-10 00:00:00', 'Heatwave', 'Medium', 12, 50000, 100.00, 
 'Severe heatwave with temperatures exceeding 42°C.', 'IMD'),
 
('Chennai', 13.0827, 80.2707, '2019-12-02 00:00:00', 'Cyclone', 'High', 3, 120000, 2000.00, 
 'Cyclone impact with heavy winds and rainfall.', 'IMD');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for historical_climate_data
CREATE TRIGGER update_historical_climate_updated_at 
BEFORE UPDATE ON historical_climate_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE historical_climate_data IS 'Historical climate data for pattern analysis and prediction';
COMMENT ON TABLE historical_disasters IS 'Historical disaster records for risk assessment';
COMMENT ON TABLE pattern_analysis_cache IS 'Cache for pattern analysis results';

COMMENT ON COLUMN historical_climate_data.disaster_occurred IS 'Whether a disaster occurred on this date';
COMMENT ON COLUMN historical_disasters.severity IS 'Disaster severity: Low, Medium, High, Critical';
COMMENT ON COLUMN pattern_analysis_cache.pattern_match IS 'Percentage match with historical disaster patterns (0-100)';
