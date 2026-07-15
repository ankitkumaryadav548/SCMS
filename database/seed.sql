-- Seed Data for Smart City Management System

-- 1. Insert Users (Passwords are hashed for 'password123' using bcrypt)
-- Hashed value for 'password123': $2a$10$wKlhM31.lR2YgC7BvG52A.Q2fWJ4p7F3C2uY4/27qGgA3e7qE2XJy
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Admin User', 'admin@smartcity.gov', '$2a$10$wKlhM31.lR2YgC7BvG52A.Q2fWJ4p7F3C2uY4/27qGgA3e7qE2XJy', 'Admin'),
(2, 'Operator Jane', 'jane.operator@smartcity.gov', '$2a$10$wKlhM31.lR2YgC7BvG52A.Q2fWJ4p7F3C2uY4/27qGgA3e7qE2XJy', 'Operator'),
(3, 'John Citizen', 'john.doe@gmail.com', '$2a$10$wKlhM31.lR2YgC7BvG52A.Q2fWJ4p7F3C2uY4/27qGgA3e7qE2XJy', 'Citizen'),
(4, 'Guest Visitor', 'visitor@smartcity.gov', '$2a$10$wKlhM31.lR2YgC7BvG52A.Q2fWJ4p7F3C2uY4/27qGgA3e7qE2XJy', 'Visitor');

-- 2. Insert Traffic Sensors (City Center, Main Highway, etc.)
INSERT INTO `traffic_sensors` (`id`, `name`, `location_lat`, `location_lng`, `status`, `current_density`, `avg_speed`) VALUES
(1, 'Central Avenue Intersection', 40.712776, -74.005974, 'Active', 75, 22.50),
(2, 'West Highway Tollgate', 40.730610, -73.935242, 'Active', 40, 58.20),
(3, 'North Boulevard Cross', 40.758896, -73.985130, 'Active', 95, 12.00),
(4, 'East Bridge Entrance', 40.706086, -73.996864, 'Maintenance', 0, 0.00),
(5, 'South Park Street Gate', 40.725825, -74.009210, 'Active', 25, 42.10);

-- 3. Insert Traffic Logs for analytics history
INSERT INTO `traffic_logs` (`sensor_id`, `density`, `avg_speed`, `logged_at`) VALUES
(1, 80, 20.00, NOW() - INTERVAL 4 HOUR),
(1, 85, 18.50, NOW() - INTERVAL 3 HOUR),
(1, 70, 25.00, NOW() - INTERVAL 2 HOUR),
(1, 75, 22.50, NOW() - INTERVAL 1 HOUR),
(2, 35, 62.00, NOW() - INTERVAL 3 HOUR),
(2, 45, 55.00, NOW() - INTERVAL 2 HOUR),
(2, 40, 58.20, NOW() - INTERVAL 1 HOUR),
(3, 90, 15.00, NOW() - INTERVAL 2 HOUR),
(3, 95, 12.00, NOW() - INTERVAL 1 HOUR);

-- 4. Insert Emergency Incidents
INSERT INTO `emergency_incidents` (`id`, `title`, `description`, `type`, `severity`, `location_lat`, `location_lng`, `status`, `reported_by`) VALUES
(1, 'Main St Warehouse Fire', 'Large commercial building fire reported. Heavy smoke.', 'Fire', 'Critical', 40.715000, -74.008000, 'Dispatched', 2),
(2, 'Route 9 Accident', 'Two-car collision blocking the right lane. No major injuries.', 'Accident', 'Medium', 40.732000, -73.938000, 'Reported', 3),
(3, 'City Center Water Main Burst', 'Water main burst flooding the lower subway tunnel entrance.', 'Flood', 'High', 40.758000, -73.984000, 'Resolved', 1);

-- 5. Insert Utility Grids
INSERT INTO `utility_grids` (`id`, `name`, `type`, `capacity`, `current_load`, `status`, `location_lat`, `location_lng`) VALUES
(1, 'Downtown Substation A', 'Electricity', 5000.00, 4200.50, 'Normal', 40.712000, -74.001000),
(2, 'East District Water Reservoir', 'Water', 12000.00, 8500.00, 'Normal', 40.709000, -73.990000),
(3, 'North Gas Distributary 3', 'Gas', 3000.00, 2950.00, 'Overloaded', 40.760000, -73.980000);

-- 6. Insert Node Logs
INSERT INTO `node_logs` (`module`, `action`, `details`) VALUES
('Emergency', 'Dispatched Fire Unit', '{"incident_id": 1, "station": "Station 4", "units": ["Engine 12", "Ladder 5"]}'),
('Utility', 'Load Balancing Advisory Triggered', '{"grid_id": 3, "current_load": 2950.00, "threshold": 2700.00, "action": "Reroute 250 units via Sub-grid 2"}');
