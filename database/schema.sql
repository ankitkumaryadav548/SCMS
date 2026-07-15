-- Smart City Management System Database Schema
-- DBMS: MySQL 8.x

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `traffic_sensors`;
DROP TABLE IF EXISTS `traffic_logs`;
DROP TABLE IF EXISTS `emergency_incidents`;
DROP TABLE IF EXISTS `utility_grids`;
DROP TABLE IF EXISTS `node_logs`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Citizen', 'Visitor', 'Operator', 'Admin') DEFAULT 'Citizen',
  `reset_token` VARCHAR(255) DEFAULT NULL,
  `reset_token_expires` TIMESTAMP DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Traffic Sensors Table
CREATE TABLE `traffic_sensors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `location_lat` DECIMAL(10, 8) NOT NULL,
  `location_lng` DECIMAL(11, 8) NOT NULL,
  `status` ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
  `current_density` INT DEFAULT 0 COMMENT 'Vehicles per unit area',
  `avg_speed` DECIMAL(5, 2) DEFAULT 0.0 COMMENT 'km/h',
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Traffic Logs Table (for analytics)
CREATE TABLE `traffic_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sensor_id` INT NOT NULL,
  `density` INT NOT NULL,
  `avg_speed` DECIMAL(5, 2) NOT NULL,
  `logged_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sensor_id`) REFERENCES `traffic_sensors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Emergency Incidents Table
CREATE TABLE `emergency_incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `type` ENUM('Fire', 'Accident', 'Flood', 'Power Outage', 'Medical') NOT NULL,
  `severity` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
  `location_lat` DECIMAL(10, 8) NOT NULL,
  `location_lng` DECIMAL(11, 8) NOT NULL,
  `status` ENUM('Reported', 'Dispatched', 'Resolved', 'Closed') DEFAULT 'Reported',
  `reported_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Utility Grids Table (Water, Electricity, Gas)
CREATE TABLE `utility_grids` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('Electricity', 'Water', 'Gas') NOT NULL,
  `capacity` DECIMAL(12, 2) NOT NULL COMMENT 'Capacity in KW/Liters/CubicMeters',
  `current_load` DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
  `status` ENUM('Normal', 'Overloaded', 'Outage', 'Maintenance') DEFAULT 'Normal',
  `location_lat` DECIMAL(10, 8) NOT NULL,
  `location_lng` DECIMAL(11, 8) NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Node Logs (General Audit Logs for Algorithm Engine decisions)
CREATE TABLE `node_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module` VARCHAR(50) NOT NULL COMMENT 'Traffic, Utility, Emergency',
  `action` VARCHAR(255) NOT NULL,
  `details` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
