-- =============================================
-- RESTAURANTFLOW DATABASE SCHEMA (FINAL)
-- MySQL Version - With RBAC, No Stored Procedures
-- =============================================

-- Set database defaults
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. CORE BUSINESS ENTITIES
-- =============================================

-- Restaurant table
CREATE TABLE `restaurants` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(100) NOT NULL,
    `legal_name` VARCHAR(100),
    `tax_id` VARCHAR(50) UNIQUE,
    `phone` VARCHAR(20),
    `email` VARCHAR(100),
    `address` TEXT,
    `logo_url` TEXT,
    `timezone` VARCHAR(50) DEFAULT 'UTC',
    `currency` VARCHAR(3) DEFAULT 'KSH',
    `status` ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tables table
CREATE TABLE `tables` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `table_number` VARCHAR(10) NOT NULL,
    `capacity` INT DEFAULT 4,
    `section` VARCHAR(50),
    `qr_code` TEXT,
    `status` ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
    `current_order_id` CHAR(36),
    `last_occupied_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_table_number` (`restaurant_id`, `table_number`),
    UNIQUE KEY `uq_qr_code` (`qr_code`(255)),
    KEY `idx_restaurant_status` (`restaurant_id`, `status`),
    CONSTRAINT `fk_tables_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. USER MANAGEMENT WITH RBAC
-- =============================================

-- Roles table
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `is_system` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_restaurant` (`restaurant_id`, `name`),
    CONSTRAINT `fk_roles_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(100) NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_permission` (`resource`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions junction table
CREATE TABLE `role_permissions` (
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) 
        REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) 
        REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20),
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    `shift_preference` JSON,
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_email` (`email`),
    UNIQUE KEY `uq_phone` (`phone`),
    KEY `idx_restaurant_role` (`restaurant_id`, `role_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_users_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) 
        REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. CUSTOMER MANAGEMENT
-- =============================================

-- Customers table
CREATE TABLE `customers` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100),
    `first_name` VARCHAR(50),
    `last_name` VARCHAR(50),
    `loyalty_points` INT DEFAULT 0,
    `loyalty_tier` VARCHAR(20) DEFAULT 'Bronze',
    `total_spent` DECIMAL(10,2) DEFAULT 0.00,
    `visit_count` INT DEFAULT 0,
    `last_visit` TIMESTAMP NULL,
    `birth_date` DATE,
    `dietary_preferences` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_phone_restaurant` (`restaurant_id`, `phone`),
    UNIQUE KEY `uq_email_restaurant` (`restaurant_id`, `email`),
    KEY `idx_loyalty_tier` (`loyalty_tier`),
    KEY `idx_last_visit` (`last_visit`),
    CONSTRAINT `fk_customers_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty table
CREATE TABLE `loyalty` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `customer_id` CHAR(36) NOT NULL,
    `restaurant_id` CHAR(36) NOT NULL,
    `points_balance` INT DEFAULT 0,
    `lifetime_points` INT DEFAULT 0,
    `points_redeemed` INT DEFAULT 0,
    `tier` VARCHAR(20),
    `tier_benefits` JSON,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_customer` (`customer_id`),
    KEY `idx_restaurant` (`restaurant_id`),
    CONSTRAINT `fk_loyalty_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_loyalty_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Preferences table
CREATE TABLE `customer_preferences` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `customer_id` CHAR(36) NOT NULL,
    `favorite_items` JSON,
    `favorite_modifiers` JSON,
    `payment_preferences` JSON,
    `dining_preferences` JSON,
    `notification_preferences` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_customer` (`customer_id`),
    CONSTRAINT `fk_customer_preferences_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. MENU MANAGEMENT
-- =============================================

-- Menu Categories table
CREATE TABLE `menu_categories` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `display_order` INT DEFAULT 0,
    `icon` VARCHAR(50),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_restaurant` (`restaurant_id`, `name`),
    KEY `idx_display_order` (`display_order`),
    CONSTRAINT `fk_menu_categories_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Items table
CREATE TABLE `menu_items` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `category_id` CHAR(36),
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(10,2) NOT NULL,
    `cost` DECIMAL(10,2),
    `image_url` TEXT,
    `nutritional_info` JSON,
    `preparation_time` INT DEFAULT 15,
    `is_available` BOOLEAN DEFAULT TRUE,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `tags` JSON,
    `kitchen_station_id` CHAR(36),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_restaurant_category` (`restaurant_id`, `category_id`),
    KEY `idx_availability` (`is_available`),
    KEY `idx_featured` (`is_featured`),
    FULLTEXT KEY `ft_name_description` (`name`, `description`),
    CONSTRAINT `fk_menu_items_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_menu_items_category` FOREIGN KEY (`category_id`) 
        REFERENCES `menu_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modifier Groups table
CREATE TABLE `modifier_groups` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `selection_type` ENUM('single', 'multiple') DEFAULT 'single',
    `min_selections` INT DEFAULT 0,
    `max_selections` INT,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_restaurant` (`restaurant_id`, `name`),
    CONSTRAINT `fk_modifier_groups_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modifier Options table
CREATE TABLE `modifier_options` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `modifier_group_id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `price_adjustment` DECIMAL(10,2) DEFAULT 0.00,
    `description` TEXT,
    `is_default` BOOLEAN DEFAULT FALSE,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_group` (`modifier_group_id`, `name`),
    CONSTRAINT `fk_modifier_options_group` FOREIGN KEY (`modifier_group_id`) 
        REFERENCES `modifier_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Item Modifiers (junction table)
CREATE TABLE `menu_item_modifiers` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `menu_item_id` CHAR(36) NOT NULL,
    `modifier_group_id` CHAR(36) NOT NULL,
    `is_required` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_menu_item_modifier_group` (`menu_item_id`, `modifier_group_id`),
    CONSTRAINT `fk_mim_menu_item` FOREIGN KEY (`menu_item_id`) 
        REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mim_modifier_group` FOREIGN KEY (`modifier_group_id`) 
        REFERENCES `modifier_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. ORDER MANAGEMENT
-- =============================================

-- Orders table
CREATE TABLE `orders` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_number` VARCHAR(20) NOT NULL,
    `restaurant_id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36),
    `table_id` CHAR(36),
    `waiter_id` CHAR(36),
    `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled') NOT NULL,
    `order_type` ENUM('dine-in', 'takeaway', 'delivery') NOT NULL,
    `payment_status` ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    `subtotal` DECIMAL(10,2),
    `tax_amount` DECIMAL(10,2),
    `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
    `service_charge` DECIMAL(10,2) DEFAULT 0.00,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `customer_notes` TEXT,
    `preparation_time` INT,
    `actual_prep_time` INT,
    `confirmed_at` TIMESTAMP NULL,
    `prepared_at` TIMESTAMP NULL,
    `delivered_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `cancelled_at` TIMESTAMP NULL,
    `cancelled_reason` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_order_number` (`order_number`),
    KEY `idx_restaurant_status` (`restaurant_id`, `status`),
    KEY `idx_waiter_status` (`waiter_id`, `status`),
    KEY `idx_table_status` (`table_id`, `status`),
    KEY `idx_customer` (`customer_id`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_payment_status` (`payment_status`),
    CONSTRAINT `fk_orders_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) 
        REFERENCES `tables` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_orders_waiter` FOREIGN KEY (`waiter_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE `order_items` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_id` CHAR(36) NOT NULL,
    `menu_item_id` CHAR(36) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10,2),
    `total_price` DECIMAL(10,2),
    `special_instructions` TEXT,
    `status` ENUM('pending', 'preparing', 'ready', 'delivered') DEFAULT 'pending',
    `kitchen_station_id` CHAR(36),
    `kitchen_notes` TEXT,
    `prepared_at` TIMESTAMP NULL,
    `delivered_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_order_status` (`order_id`, `status`),
    KEY `idx_kitchen_station` (`kitchen_station_id`, `status`),
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_menu_item` FOREIGN KEY (`menu_item_id`) 
        REFERENCES `menu_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Item Modifiers table
CREATE TABLE `order_item_modifiers` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_item_id` CHAR(36) NOT NULL,
    `modifier_option_id` CHAR(36) NOT NULL,
    `price_adjustment` DECIMAL(10,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_order_item_modifier` (`order_item_id`, `modifier_option_id`),
    CONSTRAINT `fk_oim_order_item` FOREIGN KEY (`order_item_id`) 
        REFERENCES `order_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_oim_modifier_option` FOREIGN KEY (`modifier_option_id`) 
        REFERENCES `modifier_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Status History table
CREATE TABLE `order_status_history` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_id` CHAR(36) NOT NULL,
    `status_from` VARCHAR(20),
    `status_to` VARCHAR(20) NOT NULL,
    `changed_by` CHAR(36),
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_order_history` (`order_id`, `created_at`),
    CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. PAYMENT MANAGEMENT
-- =============================================

-- Payments table
CREATE TABLE `payments` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_id` CHAR(36) NOT NULL,
    `payment_method` ENUM('mpesa', 'card', 'cash', 'wallet', 'other') NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `reference_number` VARCHAR(50),
    `status` ENUM('pending', 'processing', 'successful', 'failed', 'refunded') NOT NULL,
    `gateway_response` JSON,
    `transaction_fee` DECIMAL(10,2) DEFAULT 0.00,
    `processed_at` TIMESTAMP NULL,
    `refunded_at` TIMESTAMP NULL,
    `refund_reference` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_reference_number` (`reference_number`),
    KEY `idx_order_payment` (`order_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. KITCHEN MANAGEMENT
-- =============================================

-- Kitchen Stations table
CREATE TABLE `kitchen_stations` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `priority` INT DEFAULT 1,
    `status` ENUM('active', 'maintenance') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_restaurant` (`restaurant_id`, `name`),
    CONSTRAINT `fk_kitchen_stations_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key to menu_items for kitchen_station
ALTER TABLE `menu_items` 
    ADD CONSTRAINT `fk_menu_items_kitchen_station` 
    FOREIGN KEY (`kitchen_station_id`) 
    REFERENCES `kitchen_stations` (`id`) ON DELETE SET NULL;

-- Add foreign key to order_items for kitchen_station
ALTER TABLE `order_items` 
    ADD CONSTRAINT `fk_order_items_kitchen_station` 
    FOREIGN KEY (`kitchen_station_id`) 
    REFERENCES `kitchen_stations` (`id`) ON DELETE SET NULL;

-- Kitchen Tasks table
CREATE TABLE `kitchen_tasks` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `order_item_id` CHAR(36) NOT NULL,
    `kitchen_station_id` CHAR(36) NOT NULL,
    `status` ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
    `priority` INT DEFAULT 1,
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_station_status` (`kitchen_station_id`, `status`),
    KEY `idx_priority` (`priority`),
    CONSTRAINT `fk_kitchen_tasks_order_item` FOREIGN KEY (`order_item_id`) 
        REFERENCES `order_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_kitchen_tasks_station` FOREIGN KEY (`kitchen_station_id`) 
        REFERENCES `kitchen_stations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. INVENTORY MANAGEMENT
-- =============================================

-- Ingredients table
CREATE TABLE `ingredients` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `cost_per_unit` DECIMAL(10,2),
    `minimum_stock` DECIMAL(10,2),
    `current_stock` DECIMAL(10,2) DEFAULT 0.00,
    `supplier` VARCHAR(100),
    `category` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_name_restaurant` (`restaurant_id`, `name`),
    KEY `idx_stock_level` (`current_stock`, `minimum_stock`),
    CONSTRAINT `fk_ingredients_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipes table
CREATE TABLE `recipes` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `menu_item_id` CHAR(36) NOT NULL,
    `version` INT DEFAULT 1,
    `yield_quantity` INT DEFAULT 1,
    `yield_unit` VARCHAR(20),
    `instructions` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_by` CHAR(36),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_menu_item_active` (`menu_item_id`, `is_active`),
    CONSTRAINT `fk_recipes_menu_item` FOREIGN KEY (`menu_item_id`) 
        REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_recipes_user` FOREIGN KEY (`created_by`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe Ingredients table
CREATE TABLE `recipe_ingredients` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `recipe_id` CHAR(36) NOT NULL,
    `ingredient_id` CHAR(36) NOT NULL,
    `quantity` DECIMAL(10,2) NOT NULL,
    `unit` VARCHAR(20),
    `cost_per_unit` DECIMAL(10,2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_recipe_ingredient` (`recipe_id`, `ingredient_id`),
    CONSTRAINT `fk_ri_recipe` FOREIGN KEY (`recipe_id`) 
        REFERENCES `recipes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ri_ingredient` FOREIGN KEY (`ingredient_id`) 
        REFERENCES `ingredients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Transactions table
CREATE TABLE `inventory_transactions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `ingredient_id` CHAR(36) NOT NULL,
    `transaction_type` ENUM('purchase', 'usage', 'return', 'waste', 'adjustment') NOT NULL,
    `quantity_change` DECIMAL(10,2) NOT NULL,
    `quantity_after` DECIMAL(10,2),
    `reference_id` CHAR(36),
    `reference_type` VARCHAR(50),
    `notes` TEXT,
    `performed_by` CHAR(36),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ingredient` (`ingredient_id`),
    KEY `idx_reference` (`reference_id`, `reference_type`),
    CONSTRAINT `fk_it_ingredient` FOREIGN KEY (`ingredient_id`) 
        REFERENCES `ingredients` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_it_user` FOREIGN KEY (`performed_by`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9. PROMOTIONS & MARKETING
-- =============================================

-- Promotions table
CREATE TABLE `promotions` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurant_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `type` ENUM('percentage', 'fixed', 'buy_x_get_y') NOT NULL,
    `value` DECIMAL(10,2) NOT NULL,
    `code` VARCHAR(20),
    `min_order_value` DECIMAL(10,2),
    `max_discount` DECIMAL(10,2),
    `applicable_items` JSON,
    `applicable_categories` JSON,
    `start_date` TIMESTAMP NOT NULL,
    `end_date` TIMESTAMP NOT NULL,
    `usage_limit` INT,
    `used_count` INT DEFAULT 0,
    `customer_eligibility` JSON,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_code` (`code`),
    KEY `idx_active_dates` (`is_active`, `start_date`, `end_date`),
    CONSTRAINT `fk_promotions_restaurant` FOREIGN KEY (`restaurant_id`) 
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. AUDIT & LOGGING
-- =============================================

-- Audit Log table
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36),
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36),
    `old_values` JSON,
    `new_values` JSON,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_action` (`user_id`, `action`),
    KEY `idx_entity` (`entity_type`, `entity_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. TRIGGERS FOR AUTO-UPDATES
-- =============================================

DELIMITER //

-- Trigger to update table status when order is created
CREATE TRIGGER `update_table_status_on_order` 
AFTER INSERT ON `orders` 
FOR EACH ROW 
BEGIN
    IF NEW.table_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'preparing', 'ready') THEN
        UPDATE `tables` 
        SET `status` = 'occupied', 
            `current_order_id` = NEW.id,
            `last_occupied_at` = NEW.created_at
        WHERE `id` = NEW.table_id;
    END IF;
END//

-- Trigger to update table status when order is completed or cancelled
CREATE TRIGGER `update_table_status_on_order_complete` 
AFTER UPDATE ON `orders` 
FOR EACH ROW 
BEGIN
    IF OLD.table_id IS NOT NULL 
       AND NEW.status IN ('completed', 'cancelled') 
       AND OLD.status NOT IN ('completed', 'cancelled') THEN
        UPDATE `tables` 
        SET `status` = 'available', 
            `current_order_id` = NULL
        WHERE `id` = OLD.table_id 
        AND `current_order_id` = OLD.id;
    END IF;
END//

DELIMITER ;

-- =============================================
-- 12. VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Active Orders with details
CREATE OR REPLACE VIEW `v_active_orders` AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.order_type,
    o.total_amount,
    o.created_at,
    c.first_name AS customer_first_name,
    c.last_name AS customer_last_name,
    c.phone AS customer_phone,
    t.table_number,
    u.first_name AS waiter_first_name,
    u.last_name AS waiter_last_name,
    TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) AS minutes_waiting
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN users u ON o.waiter_id = u.id
WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
ORDER BY o.created_at ASC;

-- View: Daily Sales Summary
CREATE OR REPLACE VIEW `v_daily_sales` AS
SELECT 
    DATE(created_at) AS sale_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    SUM(tax_amount) AS total_tax,
    SUM(discount_amount) AS total_discounts,
    AVG(total_amount) AS avg_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT waiter_id) AS active_waiters
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- View: Current Inventory Status
CREATE OR REPLACE VIEW `v_inventory_status` AS
SELECT 
    i.id,
    i.name,
    i.current_stock,
    i.minimum_stock,
    i.unit,
    i.supplier,
    CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 'Low'
        WHEN i.current_stock <= i.minimum_stock * 1.5 THEN 'Warning'
        ELSE 'OK'
    END AS stock_status,
    (i.current_stock / NULLIF(i.minimum_stock, 0)) AS stock_ratio
FROM ingredients i
WHERE i.current_stock IS NOT NULL
ORDER BY stock_ratio ASC;

-- View: Kitchen Queue Summary
CREATE OR REPLACE VIEW `v_kitchen_queue` AS
SELECT 
    ks.id AS station_id,
    ks.name AS station_name,
    COUNT(kt.id) AS pending_tasks,
    MIN(kt.created_at) AS oldest_task,
    AVG(TIMESTAMPDIFF(MINUTE, kt.created_at, NOW())) AS avg_waiting_minutes
FROM kitchen_stations ks
LEFT JOIN kitchen_tasks kt ON ks.id = kt.kitchen_station_id AND kt.status = 'pending'
GROUP BY ks.id, ks.name
ORDER BY ks.priority ASC;

-- View: User Permissions (Helper View)
CREATE OR REPLACE VIEW `v_user_permissions` AS
SELECT 
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    r.name AS role_name,
    p.name AS permission_name,
    p.resource,
    p.action
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.status = 'active';

-- =============================================
-- 13. DEFAULT DATA
-- =============================================

-- Insert a sample restaurant
INSERT INTO `restaurants` (`id`, `name`, `phone`, `email`, `address`, `currency`) 
VALUES (UUID(), 'Sample Restaurant', '+254712345678', 'info@samplerestaurant.com', '123 Main Street, Nairobi', 'KES');

-- Insert default roles
INSERT INTO `roles` (`id`, `restaurant_id`, `name`, `description`, `is_system`) 
SELECT 
    UUID(),
    r.id,
    'admin',
    'Full system access',
    TRUE
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    'manager',
    'Manage restaurant operations',
    TRUE
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    'waiter',
    'Take orders and serve customers',
    TRUE
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    'cashier',
    'Process payments',
    TRUE
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    'kitchen',
    'Prepare food',
    TRUE
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    'inventory',
    'Manage stock',
    TRUE
FROM restaurants r;

-- Insert default permissions
INSERT INTO `permissions` (`id`, `name`, `resource`, `action`, `description`) VALUES
(UUID(), 'View Dashboard', 'dashboard', 'view', 'Access dashboard'),
(UUID(), 'View Orders', 'orders', 'view', 'View orders'),
(UUID(), 'Create Orders', 'orders', 'create', 'Create new orders'),
(UUID(), 'Update Orders', 'orders', 'update', 'Update orders'),
(UUID(), 'Cancel Orders', 'orders', 'cancel', 'Cancel orders'),
(UUID(), 'View Menu', 'menu', 'view', 'View menu items'),
(UUID(), 'Create Menu', 'menu', 'create', 'Create menu items'),
(UUID(), 'Update Menu', 'menu', 'update', 'Update menu items'),
(UUID(), 'Delete Menu', 'menu', 'delete', 'Delete menu items'),
(UUID(), 'View Inventory', 'inventory', 'view', 'View inventory'),
(UUID(), 'Update Inventory', 'inventory', 'update', 'Update inventory'),
(UUID(), 'View Staff', 'staff', 'view', 'View staff'),
(UUID(), 'Create Staff', 'staff', 'create', 'Create staff'),
(UUID(), 'Update Staff', 'staff', 'update', 'Update staff'),
(UUID(), 'Delete Staff', 'staff', 'delete', 'Delete staff'),
(UUID(), 'View Reports', 'reports', 'view', 'View reports'),
(UUID(), 'Export Reports', 'reports', 'export', 'Export reports'),
(UUID(), 'View Tables', 'tables', 'view', 'View tables'),
(UUID(), 'Update Tables', 'tables', 'update', 'Update tables'),
(UUID(), 'Process Payments', 'payments', 'process', 'Process payments'),
(UUID(), 'View Payments', 'payments', 'view', 'View payments'),
(UUID(), 'Refund Payments', 'payments', 'refund', 'Refund payments'),
(UUID(), 'View Customers', 'customers', 'view', 'View customers'),
(UUID(), 'Update Customers', 'customers', 'update', 'Update customers'),
(UUID(), 'View Loyalty', 'loyalty', 'view', 'View loyalty'),
(UUID(), 'Update Loyalty', 'loyalty', 'update', 'Update loyalty');

-- Assign permissions to roles
-- Admin: ALL permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Manager: Most permissions (no staff management)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager' 
AND p.name NOT IN ('Create Staff', 'Update Staff', 'Delete Staff');

-- Waiter: Limited permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'waiter' 
AND p.name IN ('View Dashboard', 'View Orders', 'Create Orders', 'Update Orders', 
               'View Menu', 'View Tables', 'Update Tables', 'Process Payments');

-- Cashier: Payment permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'cashier' 
AND p.name IN ('View Dashboard', 'View Orders', 'View Payments', 'Process Payments', 'Refund Payments');

-- Kitchen: Order and menu view
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'kitchen' 
AND p.name IN ('View Dashboard', 'View Orders', 'Update Orders', 'View Menu');

-- Inventory: Inventory management
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'inventory' 
AND p.name IN ('View Dashboard', 'View Inventory', 'Update Inventory');

-- Insert sample users with role_id
INSERT INTO `users` (`id`, `restaurant_id`, `role_id`, `email`, `phone`, `password_hash`, `first_name`, `last_name`, `status`) 
SELECT 
    UUID(),
    r.id,
    (SELECT id FROM roles WHERE restaurant_id = r.id AND name = 'admin'),
    'admin@samplerestaurant.com',
    '+254712345600',
    'hashed_password',
    'John',
    'Admin',
    'active'
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    (SELECT id FROM roles WHERE restaurant_id = r.id AND name = 'waiter'),
    'waiter1@samplerestaurant.com',
    '+254712345601',
    'hashed_password',
    'Jane',
    'Waiter',
    'active'
FROM restaurants r
UNION ALL
SELECT 
    UUID(),
    r.id,
    (SELECT id FROM roles WHERE restaurant_id = r.id AND name = 'kitchen'),
    'kitchen@samplerestaurant.com',
    '+254712345602',
    'hashed_password',
    'James',
    'Chef',
    'active'
FROM restaurants r;

-- Insert sample tables
INSERT INTO `tables` (`id`, `restaurant_id`, `table_number`, `capacity`, `section`) 
VALUES 
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'T1', 4, 'Main Hall'),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'T2', 4, 'Main Hall'),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'T3', 6, 'Patio');

-- Insert sample categories
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) 
VALUES 
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Burgers', 1),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Salads', 2),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Beverages', 3);

-- Insert sample kitchen stations
INSERT INTO `kitchen_stations` (`id`, `restaurant_id`, `name`, `description`, `priority`) 
VALUES 
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Grill Station', 'All grilled items', 1),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Salad Station', 'Cold items and salads', 2),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Beverage Station', 'Drinks and beverages', 3),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Dessert Station', 'Desserts and sweets', 4);

-- Insert sample ingredients
INSERT INTO `ingredients` (`id`, `restaurant_id`, `name`, `unit`, `cost_per_unit`, `minimum_stock`, `current_stock`, `supplier`, `category`) 
VALUES 
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Beef Patty', 'pcs', 2.50, 30, 120, 'Premium Meats', 'Meat'),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Burger Bun', 'pcs', 0.80, 40, 85, 'Baker\'s Choice', 'Bakery'),
    (UUID(), (SELECT id FROM restaurants LIMIT 1), 'Lettuce', 'kg', 3.00, 3, 8, 'Green Farms', 'Produce');

-- =============================================
-- RESET FOREIGN KEY CHECKS
-- =============================================

SET FOREIGN_KEY_CHECKS = 1;
