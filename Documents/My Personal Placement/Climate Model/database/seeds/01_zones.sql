-- Seed data for zones (Chennai coastal districts)

INSERT INTO zones (id, name, coordinates, population, elevation, proximity_to_water, soil_type, building_density) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Zone 1 - Marina Beach', 
 ST_GeomFromText('POLYGON((80.27 13.05, 80.28 13.05, 80.28 13.06, 80.27 13.06, 80.27 13.05))', 4326),
 75000, 2.5, 0.5, 'sandy', 0.8),

('550e8400-e29b-41d4-a716-446655440002', 'Zone 2 - Royapuram',
 ST_GeomFromText('POLYGON((80.28 13.10, 80.29 13.10, 80.29 13.11, 80.28 13.11, 80.28 13.10))', 4326),
 60000, 5.0, 1.2, 'clay', 0.7),

('550e8400-e29b-41d4-a716-446655440003', 'Zone 3 - Ennore',
 ST_GeomFromText('POLYGON((80.30 13.20, 80.31 13.20, 80.31 13.21, 80.30 13.21, 80.30 13.20))', 4326),
 45000, 3.0, 0.8, 'loam', 0.6),

('550e8400-e29b-41d4-a716-446655440004', 'Zone 4 - Adyar',
 ST_GeomFromText('POLYGON((80.25 13.00, 80.26 13.00, 80.26 13.01, 80.25 13.01, 80.25 13.00))', 4326),
 80000, 8.0, 2.0, 'clay', 0.75),

('550e8400-e29b-41d4-a716-446655440005', 'Zone 5 - Besant Nagar',
 ST_GeomFromText('POLYGON((80.26 12.99, 80.27 12.99, 80.27 13.00, 80.26 13.00, 80.26 12.99))', 4326),
 55000, 4.0, 0.6, 'sandy', 0.65);

-- Vulnerability scores for zones
INSERT INTO vulnerability_scores (zone_id, elderly_percentage, disabled_percentage, low_income_percentage, population_density, transportation_access, vulnerability_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 12.5, 5.2, 35.0, 0.85, 0.70, 65.0),
('550e8400-e29b-41d4-a716-446655440002', 15.0, 6.5, 42.0, 0.75, 0.60, 72.0),
('550e8400-e29b-41d4-a716-446655440003', 10.0, 4.0, 28.0, 0.60, 0.75, 55.0),
('550e8400-e29b-41d4-a716-446655440004', 8.5, 3.5, 22.0, 0.80, 0.85, 48.0),
('550e8400-e29b-41d4-a716-446655440005', 11.0, 4.8, 30.0, 0.70, 0.80, 58.0);

-- Assembly points
INSERT INTO assembly_points (id, name, coordinates, capacity, facilities) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Central Stadium',
 ST_GeomFromText('POINT(80.28 13.08)', 4326),
 10000, '["Medical", "Food", "Water", "Shelter"]'::jsonb),

('660e8400-e29b-41d4-a716-446655440002', 'Community Center North',
 ST_GeomFromText('POINT(80.29 13.15)', 4326),
 5000, '["Medical", "Food", "Water"]'::jsonb),

('660e8400-e29b-41d4-a716-446655440003', 'School Grounds South',
 ST_GeomFromText('POINT(80.26 13.02)', 4326),
 3000, '["Shelter", "Water"]'::jsonb);

-- Infrastructure
INSERT INTO infrastructure (zone_id, type, name, coordinates, capacity) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'hospital', 'Marina General Hospital',
 ST_GeomFromText('POINT(80.275 13.055)', 4326), 200),

('550e8400-e29b-41d4-a716-446655440002', 'hospital', 'Royapuram Medical Center',
 ST_GeomFromText('POINT(80.285 13.105)', 4326), 150),

('550e8400-e29b-41d4-a716-446655440001', 'shelter', 'Marina Emergency Shelter',
 ST_GeomFromText('POINT(80.272 13.052)', 4326), 500),

('550e8400-e29b-41d4-a716-446655440003', 'shelter', 'Ennore Community Shelter',
 ST_GeomFromText('POINT(80.305 13.205)', 4326), 400),

('550e8400-e29b-41d4-a716-446655440004', 'water_treatment', 'Adyar Water Treatment Plant',
 ST_GeomFromText('POINT(80.255 13.005)', 4326), NULL),

('550e8400-e29b-41d4-a716-446655440002', 'police_station', 'Royapuram Police Station',
 ST_GeomFromText('POINT(80.282 13.108)', 4326), NULL);

-- Default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with bcrypt
INSERT INTO users (id, username, email, password_hash, role) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@climateguardian.org',
 '$2b$10$rBV2kHf/Qr3qN8Z8vXxXxeYxYxYxYxYxYxYxYxYxYxYxYxYxYxYxY', 'Admin');

COMMENT ON TABLE zones IS 'Sample zones for Chennai coastal districts';
COMMENT ON TABLE assembly_points IS 'Safe assembly points for evacuation';
COMMENT ON TABLE infrastructure IS 'Critical infrastructure in zones';
