-- Seed data for Climate Guardian

-- Insert sample zones (Chennai coastal districts)
INSERT INTO zones (id, name, coordinates, population, elevation, proximity_to_water, soil_type, building_density) VALUES
('11111111-1111-1111-1111-111111111111', 'Zone 1 - Marina Beach', ST_GeomFromText('POLYGON((80.27 13.05, 80.28 13.05, 80.28 13.06, 80.27 13.06, 80.27 13.05))', 4326), 75000, 2, 0.5, 'sandy', 0.8),
('22222222-2222-2222-2222-222222222222', 'Zone 2 - Mylapore', ST_GeomFromText('POLYGON((80.26 13.03, 80.27 13.03, 80.27 13.04, 80.26 13.04, 80.26 13.03))', 4326), 120000, 5, 1.2, 'clay', 0.9),
('33333333-3333-3333-3333-333333333333', 'Zone 3 - Adyar', ST_GeomFromText('POLYGON((80.25 13.00, 80.26 13.00, 80.26 13.01, 80.25 13.01, 80.25 13.00))', 4326), 95000, 8, 2.5, 'loam', 0.7),
('44444444-4444-4444-4444-444444444444', 'Zone 4 - Velachery', ST_GeomFromText('POLYGON((80.22 12.97, 80.23 12.97, 80.23 12.98, 80.22 12.98, 80.22 12.97))', 4326), 150000, 12, 5.0, 'clay', 0.85),
('55555555-5555-5555-5555-555555555555', 'Zone 5 - Tambaram', ST_GeomFromText('POLYGON((80.12 12.92, 80.13 12.92, 80.13 12.93, 80.12 12.93, 80.12 12.92))', 4326), 180000, 15, 8.0, 'loam', 0.75);

-- Insert assembly points
INSERT INTO assembly_points (id, name, coordinates, capacity, facilities) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Central Assembly Point - Anna University', ST_GeomFromText('POINT(80.2330 13.0067)', 4326), 50000, '["Medical", "Food", "Water", "Shelter"]'::jsonb),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'North Assembly Point - Ennore Port', ST_GeomFromText('POINT(80.3200 13.2200)', 4326), 30000, '["Medical", "Food", "Water"]'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'South Assembly Point - Mahabalipuram', ST_GeomFromText('POINT(80.1927 12.6269)', 4326), 40000, '["Medical", "Shelter"]'::jsonb),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'West Assembly Point - Kanchipuram', ST_GeomFromText('POINT(79.7036 12.8342)', 4326), 35000, '["Food", "Water", "Shelter"]'::jsonb);

-- Insert sample users
INSERT INTO users (id, username, email, password_hash, role, district) VALUES
('99999999-9999-9999-9999-999999999999', 'admin', 'admin@climateguardian.in', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Admin', 'Chennai'),
('88888888-8888-8888-8888-888888888888', 'dispatcher', 'dispatcher@climateguardian.in', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'AlertDispatcher', 'Chennai'),
('77777777-7777-7777-7777-777777777777', 'officer', 'officer@climateguardian.in', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'EmergencyOfficer', 'Chennai'),
('66666666-6666-6666-6666-666666666666', 'auditor', 'auditor@climateguardian.in', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Auditor', 'Chennai');

-- Insert sample parameter history
INSERT INTO parameter_history (rainfall, wind_speed, humidity, soil_moisture, temperature, earthquake_magnitude, source, timestamp) VALUES
(12.0, 35, 65, 40, 32, 2.0, 'manual', NOW() - INTERVAL '1 hour'),
(15.5, 42, 70, 45, 33, 0.0, 'api', NOW() - INTERVAL '2 hours'),
(8.0, 28, 58, 35, 31, 1.5, 'manual', NOW() - INTERVAL '3 hours'),
(20.0, 55, 75, 52, 34, 0.0, 'api', NOW() - INTERVAL '4 hours'),
(45.0, 85, 88, 75, 35, 0.0, 'api', NOW() - INTERVAL '5 hours');

-- Comments
COMMENT ON TABLE zones IS 'Sample zones for Chennai coastal districts';
COMMENT ON TABLE assembly_points IS 'Sample assembly points for evacuation';
COMMENT ON TABLE users IS 'Sample users for testing (passwords are hashed)';
COMMENT ON TABLE parameter_history IS 'Sample historical weather data';
