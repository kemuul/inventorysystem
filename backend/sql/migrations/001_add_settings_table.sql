-- ============================================================
-- MIGRATION 001 — Add settings table
-- Run this if your database was created before the Settings page
-- was added (i.e. you already ran the original schema.sql once).
-- Safe to run multiple times.
-- ============================================================

USE inventorypro;

CREATE TABLE IF NOT EXISTS settings (
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

INSERT IGNORE INTO settings (id, store_name) VALUES (1, 'InventoryPro Store');
