-- Climate Guardian Database Schema
-- PostgreSQL + PostGIS

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  coordinates GEOMETRY(POLYGON, 4326),
  population INTEGER NOT NULL DEFAULT 0,
  elevation FLOAT,
  proximity_to_water FLOAT,
  soil_type VARCHAR(50),
  building_density FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zones_coordinates ON zones USING GIST(coordinates);
CREATE INDEX idx_zones_name ON zones(name);

-- Risk Classifications table
CREATE TABLE IF NOT EXISTS risk_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  risk_score FLOAT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  weather_params JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_zone_id ON risk_classifications(zone_id);
CREATE INDEX idx_risk_timestamp ON risk_classifications(timestamp);
CREATE INDEX idx_risk_level ON risk_classifications(risk_level);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_params JSONB NOT NULL,
  frames JSONB NOT NULL,
  total_affected_population INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_simulations_created_at ON simulations(created_at);

-- Simulation Frames table
CREATE TABLE IF NOT EXISTS simulation_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL CHECK (frame_number >= 0 AND frame_number <= 12),
  timestamp VARCHAR(10) NOT NULL,
  zone_risks JSONB NOT NULL,
  affected_population INTEGER,
  infrastructure_at_risk JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_frames_simulation_id ON simulation_frames(simulation_id);
CREATE INDEX idx_frames_frame_number ON simulation_frames(frame_number);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  risk_level VARCHAR(20) NOT NULL,
  decision_brief TEXT NOT NULL,
  confidence FLOAT,
  language VARCHAR(20) DEFAULT 'English',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_alerts_zone_id ON alerts(zone_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Audit Trail table (Append-only)
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID UNIQUE NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  zone_id UUID,
  risk_level VARCHAR(20),
  decision_brief TEXT,
  user_id UUID,
  parameters JSONB,
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TAMPERED')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_record_id ON audit_trail(record_id);
CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_zone_id ON audit_trail(zone_id);
CREATE INDEX idx_audit_hash ON audit_trail(hash);

-- Evacuation Routes table
CREATE TABLE IF NOT EXISTS evacuation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  assembly_point_id UUID,
  distance FLOAT NOT NULL,
  estimated_time INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  route_geometry GEOMETRY(LINESTRING, 4326),
  equity_score FLOAT,
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Congested', 'Closed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_routes_zone_id ON evacuation_routes(zone_id);
CREATE INDEX idx_routes_geometry ON evacuation_routes USING GIST(route_geometry);

-- Assembly Points table
CREATE TABLE IF NOT EXISTS assembly_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL,
  capacity INTEGER NOT NULL,
  facilities JSONB,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assembly_coordinates ON assembly_points USING GIST(coordinates);

-- Parameters History table
CREATE TABLE IF NOT EXISTS parameter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rainfall FLOAT NOT NULL,
  wind_speed FLOAT NOT NULL,
  humidity FLOAT NOT NULL,
  soil_moisture FLOAT NOT NULL,
  temperature FLOAT NOT NULL,
  earthquake_magnitude FLOAT,
  source VARCHAR(50) NOT NULL,
  user_id UUID,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_params_timestamp ON parameter_history(timestamp);

-- Alert Dispatches table
CREATE TABLE IF NOT EXISTS alert_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  channels JSONB NOT NULL,
  recipients JSONB NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Failed')),
  delivery_status JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dispatches_alert_id ON alert_dispatches(alert_id);
CREATE INDEX idx_dispatches_status ON alert_dispatches(status);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'AlertDispatcher', 'Auditor', 'EmergencyOfficer', 'PublicUser')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Vulnerability Scores table
CREATE TABLE IF NOT EXISTS vulnerability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  elderly_percentage FLOAT,
  disabled_percentage FLOAT,
  low_income_percentage FLOAT,
  population_density FLOAT,
  transportation_access FLOAT,
  vulnerability_score FLOAT NOT NULL CHECK (vulnerability_score >= 0 AND vulnerability_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vuln_zone_id ON vulnerability_scores(zone_id);

-- Infrastructure table
CREATE TABLE IF NOT EXISTS infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hospital', 'shelter', 'water_treatment', 'power_station', 'school', 'police_station')),
  name VARCHAR(255) NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL,
  capacity INTEGER,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_infra_zone_id ON infrastructure(zone_id);
CREATE INDEX idx_infra_type ON infrastructure(type);
CREATE INDEX idx_infra_coordinates ON infrastructure USING GIST(coordinates);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vulnerability_updated_at BEFORE UPDATE ON vulnerability_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE zones IS 'Geographic zones for disaster risk assessment';
COMMENT ON TABLE risk_classifications IS 'Historical risk classifications for zones';
COMMENT ON TABLE simulations IS 'Disaster simulation records';
COMMENT ON TABLE audit_trail IS 'Tamper-proof audit trail with hash chain';
COMMENT ON TABLE evacuation_routes IS 'Evacuation routes with equity weighting';
COMMENT ON TABLE assembly_points IS 'Safe assembly points for evacuation';
COMMENT ON TABLE vulnerability_scores IS 'Population vulnerability metrics by zone';
COMMENT ON TABLE infrastructure IS 'Critical infrastructure locations';
