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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_zone_id ON risk_classifications(zone_id);
CREATE INDEX idx_risk_timestamp ON risk_classifications(timestamp DESC);
CREATE INDEX idx_risk_level ON risk_classifications(risk_level);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_params JSONB NOT NULL,
  total_affected_population INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_simulations_created_at ON simulations(created_at DESC);

-- Simulation Frames table
CREATE TABLE IF NOT EXISTS simulation_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL CHECK (frame_number >= 0 AND frame_number <= 12),
  timestamp VARCHAR(10) NOT NULL,
  zone_risks JSONB NOT NULL,
  affected_population INTEGER,
  infrastructure_at_risk JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_alerts_zone_id ON alerts(zone_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_risk_level ON alerts(risk_level);

-- Audit Trail table (Append-only)
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID UNIQUE NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  zone_id UUID,
  zone_name VARCHAR(255),
  risk_level VARCHAR(20),
  decision_brief TEXT,
  user_id UUID,
  user_name VARCHAR(255),
  parameters JSONB,
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TAMPERED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX idx_audit_zone_id ON audit_trail(zone_id);
CREATE INDEX idx_audit_record_id ON audit_trail(record_id);
CREATE INDEX idx_audit_hash ON audit_trail(hash);

-- Evacuation Routes table
CREATE TABLE IF NOT EXISTS evacuation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  assembly_point_id UUID,
  assembly_point_name VARCHAR(255),
  distance FLOAT NOT NULL,
  estimated_time INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  route_geometry GEOMETRY(LINESTRING, 4326),
  equity_score FLOAT,
  vulnerability_score FLOAT,
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Congested', 'Closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  source VARCHAR(50) DEFAULT 'manual',
  user_id UUID,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_params_timestamp ON parameter_history(timestamp DESC);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'AlertDispatcher', 'EmergencyOfficer', 'Auditor', 'PublicUser')),
  district VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Alert Dispatches table
CREATE TABLE IF NOT EXISTS alert_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  language VARCHAR(20) DEFAULT 'English',
  channels JSONB NOT NULL,
  recipients JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Partial')),
  delivery_status JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

CREATE INDEX idx_dispatches_alert_id ON alert_dispatches(alert_id);
CREATE INDEX idx_dispatches_status ON alert_dispatches(status);
CREATE INDEX idx_dispatches_created_at ON alert_dispatches(created_at DESC);

-- Comments
COMMENT ON TABLE zones IS 'Geographic zones for disaster monitoring';
COMMENT ON TABLE risk_classifications IS 'Risk classifications for each zone';
COMMENT ON TABLE simulations IS 'Disaster simulation records';
COMMENT ON TABLE simulation_frames IS '12-frame disaster evolution data';
COMMENT ON TABLE alerts IS 'Generated alerts and decision briefs';
COMMENT ON TABLE audit_trail IS 'Tamper-proof audit trail with hash chain';
COMMENT ON TABLE evacuation_routes IS 'Evacuation routes with equity weighting';
COMMENT ON TABLE assembly_points IS 'Safe assembly points for evacuation';
COMMENT ON TABLE parameter_history IS 'Historical weather parameter data';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE alert_dispatches IS 'Alert dispatch tracking (SMS/Email/WhatsApp)';
