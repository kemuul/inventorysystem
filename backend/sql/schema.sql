-- ============================================================
-- INVENTORYPRO — DATABASE SCHEMA
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventorypro
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inventorypro;

-- ------------------------------------------------------------
-- 1. USERS  (admins / staff who use the system)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. SUPPLIERS
-- ------------------------------------------------------------
CREATE TABLE suppliers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone          VARCHAR(30),
  email          VARCHAR(150),
  address        VARCHAR(255),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. PRODUCTS  (core table — current price + current stock live here)
-- ------------------------------------------------------------
CREATE TABLE products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  sku            VARCHAR(50) NOT NULL UNIQUE,
  name           VARCHAR(150) NOT NULL,
  category_id    INT,
  supplier_id    INT,
  image_url      VARCHAR(255),
  cost_price     DECIMAL(10,2) NOT NULL DEFAULT 0,   -- what you paid
  selling_price  DECIMAL(10,2) NOT NULL DEFAULT 0,   -- what you charge
  market_price   DECIMAL(10,2) DEFAULT NULL,         -- competitor/market reference price
  initial_stock  INT NOT NULL DEFAULT 0,              -- stock when first added
  current_stock  INT NOT NULL DEFAULT 0,              -- live quantity on hand
  reorder_level  INT NOT NULL DEFAULT 10,             -- threshold that triggers "low stock"
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_products_stock (current_stock),
  INDEX idx_products_name (name)
);

-- ------------------------------------------------------------
-- 5. STOCK_MOVEMENTS  (restock history + every stock change, audit trail)
-- ------------------------------------------------------------
CREATE TABLE stock_movements (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  type        ENUM('restock', 'sale', 'damaged', 'expired', 'adjustment') NOT NULL,
  quantity    INT NOT NULL,                 -- always positive; `type` tells direction
  note        VARCHAR(255),
  created_by  INT,                          -- references users.id
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_movement_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_movement_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_movement_product_date (product_id, created_at)
);

-- ------------------------------------------------------------
-- 6. SALES  (one row per transaction / receipt)
-- ------------------------------------------------------------
CREATE TABLE sales (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  sale_date     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_name VARCHAR(150) DEFAULT 'Walk-in Customer',
  total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sales_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sales_date (sale_date)
);

-- ------------------------------------------------------------
-- 7. SALE_ITEMS  (line items per sale — snapshots price at time of sale)
-- ------------------------------------------------------------
CREATE TABLE sale_items (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  sale_id          INT NOT NULL,
  product_id       INT NOT NULL,
  quantity         INT NOT NULL,
  unit_price       DECIMAL(10,2) NOT NULL,   -- selling price at time of sale
  unit_cost        DECIMAL(10,2) NOT NULL,   -- cost price at time of sale (for accurate profit history)
  subtotal         DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  CONSTRAINT fk_saleitem_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_saleitem_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_saleitem_product (product_id)
);

-- ------------------------------------------------------------
-- 8. PRICE_HISTORY  (every time cost/selling price changes)
-- ------------------------------------------------------------
CREATE TABLE price_history (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  product_id     INT NOT NULL,
  cost_price     DECIMAL(10,2) NOT NULL,
  selling_price  DECIMAL(10,2) NOT NULL,
  changed_by     INT,
  changed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pricehist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pricehist_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_pricehist_product_date (product_id, changed_at)
);

-- ------------------------------------------------------------
-- 9. MARKET_PRICES  (external/competitor price snapshots over time)
-- ------------------------------------------------------------
CREATE TABLE market_prices (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  market_price DECIMAL(10,2) NOT NULL,
  source       VARCHAR(150),          -- e.g. "Shopee", "Competitor A", "Manual entry"
  recorded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_marketprice_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_marketprice_product_date (product_id, recorded_at)
);

-- ------------------------------------------------------------
-- 10. EXPENSES  (operating costs — rent, utilities, wages, etc.)
-- ------------------------------------------------------------
CREATE TABLE expenses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  category     VARCHAR(100) NOT NULL,   -- e.g. "Rent", "Utilities", "Wages"
  description  VARCHAR(255),
  amount       DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_expenses_date (expense_date)
);

-- ------------------------------------------------------------
-- 11. LOSSES  (damaged / expired / stolen inventory — reduces profit)
-- ------------------------------------------------------------
CREATE TABLE losses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  reason      ENUM('damaged', 'expired', 'theft', 'other') NOT NULL,
  cost_impact DECIMAL(10,2) NOT NULL,  -- quantity * cost_price at the time
  loss_date   DATE NOT NULL,
  notes       VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_losses_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_losses_date (loss_date)
);

-- ------------------------------------------------------------
-- 12. SETTINGS  (single-row store configuration, powers the Settings page)
-- ------------------------------------------------------------
CREATE TABLE settings (
  id                        INT PRIMARY KEY DEFAULT 1,
  store_name                VARCHAR(150) NOT NULL DEFAULT 'My Store',
  contact_email             VARCHAR(150),
  phone                     VARCHAR(30),
  address                   VARCHAR(255),
  currency_symbol           VARCHAR(5) NOT NULL DEFAULT '₱',
  default_reorder_level     INT NOT NULL DEFAULT 10,
  low_stock_alerts_enabled  TINYINT(1) NOT NULL DEFAULT 1,
  updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed the single settings row so the app always has something to read/update.
INSERT INTO settings (id, store_name) VALUES (1, 'InventoryPro Store');

-- ============================================================
-- ENTITY RELATIONSHIP SUMMARY
-- ============================================================
-- categories 1---N products
-- suppliers  1---N products
-- products   1---N stock_movements   (restock history / audit trail)
-- products   1---N sale_items  N---1 sales   (many-to-many via junction)
-- products   1---N price_history     (cost/selling price over time)
-- products   1---N market_prices     (market price over time)
-- products   1---N losses            (damaged/expired/theft)
-- users      1---N stock_movements / sales / price_history (who did what)
-- expenses stands alone, aggregated with sales+losses for P&L
-- settings is a single fixed row (id=1), read/written by the Settings page
