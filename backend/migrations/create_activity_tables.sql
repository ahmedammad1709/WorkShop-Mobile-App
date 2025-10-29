-- Create activity_types table
CREATE TABLE IF NOT EXISTS `activity_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert the 4 fixed activity categories
INSERT INTO `activity_types` (`name`) VALUES
('Inspection'),
('Repair'),
('Maintenance'),
('Diagnostics')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Create activity_item_types table
CREATE TABLE IF NOT EXISTS `activity_item_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_activity_id` (`activity_id`),
  CONSTRAINT `fk_activity_id` FOREIGN KEY (`activity_id`) REFERENCES `activity_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert some sample data for testing
INSERT INTO `activity_item_types` (`activity_id`, `item_name`, `description`) VALUES
(1, 'Visual Inspection', 'Basic visual inspection of components'),
(1, 'Safety Check', 'Safety systems and protocols verification'),
(2, 'Component Replacement', 'Replace faulty or worn components'),
(2, 'System Repair', 'Repair of damaged systems'),
(3, 'Routine Maintenance', 'Regular scheduled maintenance tasks'),
(3, 'Preventive Care', 'Preventive maintenance procedures'),
(4, 'System Diagnostics', 'Comprehensive system diagnostic tests'),
(4, 'Troubleshooting', 'Problem identification and analysis');