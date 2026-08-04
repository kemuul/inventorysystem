-- ============================================================
-- INVENTORYPRO — SAMPLE SEED DATA
-- Run after schema.sql. Gives you enough data to see the
-- dashboard populated immediately.
-- ============================================================

USE inventorypro;

INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@inventorypro.com', '$2b$10$replace_with_real_bcrypt_hash', 'admin');

INSERT INTO categories (name, description) VALUES
('Beverages', 'Drinks and liquids'),
('Snacks', 'Packaged snack foods'),
('Household', 'General household items');

INSERT INTO suppliers (name, contact_person, phone, email) VALUES
('Cebu Trading Co.', 'Maria Santos', '0917-000-1111', 'sales@cebutrading.com'),
('Visayas Distributors', 'Juan Dela Cruz', '0917-222-3333', 'juan@visayasdist.com');

-- Products (mirrors the dashboard mock: Product X, Y, A, B, C, D, E, F, G)
INSERT INTO products (sku, name, category_id, supplier_id, cost_price, selling_price, market_price, initial_stock, current_stock, reorder_level) VALUES
('SKU-X001', 'Product X', 1, 1, 32.00, 52.00, 55.00, 200, 80, 20),
('SKU-Y002', 'Product Y', 1, 1, 28.00, 50.00, 49.00, 150, 52, 20),
('SKU-A003', 'Product A', 2, 2, 25.00, 50.00, 48.00, 120, 45, 20),
('SKU-B004', 'Product B', 2, 2, 22.00, 50.00, 52.00, 100, 40, 15),
('SKU-C005', 'Product C', 3, 1, 20.00, 50.00, 50.00, 90, 45, 15),
('SKU-D006', 'Product D', 1, 1, 18.00, 35.00, 34.00, 60, 3, 10),
('SKU-E007', 'Product E', 2, 2, 15.00, 30.00, 32.00, 60, 5, 10),
('SKU-F008', 'Product F', 3, 2, 40.00, 75.00, 78.00, 30, 0, 10),
('SKU-G009', 'Product G', 1, 1, 12.00, 25.00, 24.00, 50, 2, 10);

-- Price history snapshot (initial price set for every product)
INSERT INTO price_history (product_id, cost_price, selling_price, changed_by)
SELECT id, cost_price, selling_price, 1 FROM products;

-- Market price snapshot
INSERT INTO market_prices (product_id, market_price, source)
SELECT id, market_price, 'Manual entry' FROM products WHERE market_price IS NOT NULL;

-- A week of sales (Mon–Sun) so the Profit & Loss chart has data
INSERT INTO sales (sale_date, customer_name, total_amount, created_by) VALUES
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'Walk-in Customer', 12500.00, 1),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Walk-in Customer', 13200.00, 1),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Walk-in Customer', 12800.00, 1),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Walk-in Customer', 16400.00, 1),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Walk-in Customer', 17600.00, 1),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Walk-in Customer', 16100.00, 1),
(CURDATE(), 'Walk-in Customer', 15890.00, 1);

-- Sale items for "today" (id 7) — drives Top Selling Products
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost) VALUES
(7, 1, 120, 52.00, 32.00),  -- Product X
(7, 2, 98, 50.00, 28.00),   -- Product Y
(7, 3, 75, 50.00, 25.00),   -- Product A
(7, 4, 60, 50.00, 22.00),   -- Product B
(7, 5, 45, 50.00, 20.00);   -- Product C

-- A restock + a couple of stock movements for audit trail
INSERT INTO stock_movements (product_id, type, quantity, note, created_by) VALUES
(1, 'restock', 200, 'Initial stock intake', 1),
(1, 'sale', 120, 'Sold today', 1),
(6, 'damaged', 5, 'Water damage during storage', 1);

-- A sample expense and a sample loss, so P&L has real deductions
INSERT INTO expenses (category, description, amount, expense_date) VALUES
('Rent', 'Monthly store rent', 8000.00, CURDATE()),
('Utilities', 'Electricity & water', 1500.00, CURDATE());

INSERT INTO losses (product_id, quantity, reason, cost_impact, loss_date, notes) VALUES
(6, 5, 'damaged', 90.00, CURDATE(), 'Water damage during storage');
