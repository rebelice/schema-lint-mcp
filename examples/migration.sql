-- Example Database Migration Script
-- This migration demonstrates various DDL and DML operations that would be validated by migration rules

-- Migration: Add user preferences feature
-- Version: 2024_01_15_add_user_preferences
-- Author: Database Team

-- Step 1: Add new columns to existing users table
ALTER TABLE users 
ADD COLUMN preferences JSON DEFAULT '{}',
ADD COLUMN last_login TIMESTAMP;

-- Step 2: Create new user_settings table
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY idx_user_settings_user_key (user_id, setting_key)
);

-- Step 3: Add index for performance (should be done concurrently in production)
CREATE INDEX idx_users_last_login ON users(last_login);

-- Step 4: Backfill data with default values
UPDATE users 
SET preferences = '{"theme": "light", "notifications": true}'
WHERE preferences IS NULL;

-- Step 5: Add NOT NULL constraint after backfill
ALTER TABLE users 
ALTER COLUMN preferences SET NOT NULL;

-- Step 6: Drop deprecated column (dangerous operation)
-- ALTER TABLE users DROP COLUMN old_preferences;

-- Step 7: Rename column (can break applications)
-- ALTER TABLE products RENAME COLUMN desc TO description;

-- Step 8: Change column type (requires careful planning)
-- ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(12,2);

-- Step 9: Large batch update (should have row limit)
UPDATE orders 
SET status = 'completed' 
WHERE order_date < '2023-01-01' 
  AND status = 'pending';

-- Step 10: Delete old records (must have WHERE clause)
DELETE FROM user_sessions 
WHERE last_activity < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Step 11: Add foreign key to existing table
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_user
FOREIGN KEY (user_id) REFERENCES users(id);

-- Step 12: Create composite index
CREATE INDEX idx_orders_user_status_date 
ON orders(user_id, status, order_date);

-- Step 13: Add check constraint
ALTER TABLE products
ADD CONSTRAINT chk_price_positive 
CHECK (price >= 0);

-- Step 14: Modify table character set
ALTER TABLE products 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Step 15: Add unique constraint
ALTER TABLE users
ADD CONSTRAINT uk_users_username 
UNIQUE (username);

-- Step 16: Example of mixing DDL and DML (not recommended)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audit_log (action) VALUES ('migration_started');

-- Step 17: Drop table with safety check (commented out)
-- DROP TABLE IF EXISTS temporary_migration_data;

-- Step 18: Complex join query that might need optimization
SELECT u.id, u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5;

-- Step 19: Add column with position (not recommended)
-- ALTER TABLE users ADD COLUMN middle_name VARCHAR(50) AFTER full_name;

-- Step 20: Online schema change comment (for large tables)
-- For tables > 1M rows, use pt-online-schema-change or gh-ost:
-- pt-online-schema-change --alter "ADD COLUMN new_field VARCHAR(255)" D=mydb,t=large_table