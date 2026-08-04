-- ============================================================
-- INVENTORYPRO — EXAMPLE / REFERENCE SQL QUERIES
-- These are the same queries used inside the controllers.
-- Kept here so you can run them directly in MySQL Workbench
-- or the CLI while debugging.
-- ============================================================

-- 1. TOTAL SALES + REVENUE TODAY -------------------------------
SELECT
  COUNT(*)                    AS total_transactions,
  COALESCE(SUM(total_amount), 0) AS total_revenue
FROM sales
WHERE DATE(sale_date) = CURDATE();

-- 2. TOTAL PROFIT TODAY (revenue - cost, from sale_items) ------
SELECT
  COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity), 0) AS total_profit
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE DATE(s.sale_date) = CURDATE();

-- 3. % CHANGE VS YESTERDAY (generic pattern, reusable for revenue/profit/sales) --
SELECT
  (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE DATE(sale_date) = CURDATE())        AS today,
  (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE DATE(sale_date) = CURDATE() - 1)     AS yesterday,
  ROUND(
    (
      (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE DATE(sale_date) = CURDATE()) -
      (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE DATE(sale_date) = CURDATE() - 1)
    )
    / NULLIF((SELECT SUM(total_amount) FROM sales WHERE DATE(sale_date) = CURDATE() - 1), 0) * 100
  , 1) AS percent_change;

-- 4. LOW STOCK ITEMS (current_stock <= reorder_level) -----------
SELECT id, name, current_stock, reorder_level,
       CASE WHEN current_stock = 0 THEN 'Out of Stock' ELSE 'Low Stock' END AS status
FROM products
WHERE current_stock <= reorder_level AND is_active = 1
ORDER BY current_stock ASC;

-- 5. TOP SELLING PRODUCTS (this week) ----------------------------
SELECT
  p.id, p.name,
  SUM(si.quantity)                     AS units_sold,
  SUM(si.quantity * si.unit_price)     AS revenue
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
JOIN products p ON p.id = si.product_id
WHERE s.sale_date >= CURDATE() - INTERVAL 7 DAY
GROUP BY p.id, p.name
ORDER BY units_sold DESC
LIMIT 5;

-- 6. PROFIT & LOSS TREND — LAST 7 DAYS (for the area chart) -----
SELECT
  DATE(s.sale_date)                                    AS day,
  SUM(si.quantity * si.unit_price)                      AS revenue,
  SUM(si.quantity * si.unit_cost)                       AS cost,
  SUM(si.quantity * (si.unit_price - si.unit_cost))     AS profit
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
WHERE s.sale_date >= CURDATE() - INTERVAL 6 DAY
GROUP BY DATE(s.sale_date)
ORDER BY day ASC;

-- 6b. Add expenses to the same trend (revenue vs expenses vs profit) --
SELECT
  d.day,
  d.revenue,
  d.profit - COALESCE(e.total_expenses, 0) AS net_profit,
  COALESCE(e.total_expenses, 0)            AS expenses
FROM (
  SELECT DATE(s.sale_date) AS day,
         SUM(si.quantity * si.unit_price) AS revenue,
         SUM(si.quantity * (si.unit_price - si.unit_cost)) AS profit
  FROM sales s JOIN sale_items si ON si.sale_id = s.id
  WHERE s.sale_date >= CURDATE() - INTERVAL 6 DAY
  GROUP BY DATE(s.sale_date)
) d
LEFT JOIN (
  SELECT expense_date AS day, SUM(amount) AS total_expenses
  FROM expenses
  WHERE expense_date >= CURDATE() - INTERVAL 6 DAY
  GROUP BY expense_date
) e ON e.day = d.day
ORDER BY d.day;

-- 7. PRICE HISTORY FOR ONE PRODUCT (increase/decrease trend) -----
SELECT selling_price, cost_price, changed_at
FROM price_history
WHERE product_id = ?
ORDER BY changed_at ASC;

-- 8. SELLING PRICE VS MARKET PRICE COMPARISON ---------------------
SELECT
  p.id, p.name, p.selling_price, p.market_price,
  (p.selling_price - p.market_price)                         AS price_gap,
  ROUND((p.selling_price - p.market_price) / p.market_price * 100, 1) AS gap_percent,
  CASE
    WHEN p.market_price IS NULL THEN 'No market data'
    WHEN p.selling_price > p.market_price THEN 'Priced above market — consider lowering'
    WHEN p.selling_price < p.market_price THEN 'Priced below market — room to raise'
    ELSE 'Matches market price'
  END AS suggestion
FROM products p
WHERE p.is_active = 1;

-- 9. TOTAL LOSSES (damaged/expired/theft) THIS MONTH --------------
SELECT reason, SUM(quantity) AS total_qty, SUM(cost_impact) AS total_cost
FROM losses
WHERE loss_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
GROUP BY reason;

-- 10. FULL MONTHLY P&L SUMMARY -------------------------------------
SELECT
  (SELECT COALESCE(SUM(si.quantity * si.unit_price),0)
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= DATE_FORMAT(CURDATE(),'%Y-%m-01'))              AS revenue,
  (SELECT COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)),0)
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= DATE_FORMAT(CURDATE(),'%Y-%m-01'))              AS gross_profit,
  (SELECT COALESCE(SUM(amount),0) FROM expenses
     WHERE expense_date >= DATE_FORMAT(CURDATE(),'%Y-%m-01'))             AS expenses,
  (SELECT COALESCE(SUM(cost_impact),0) FROM losses
     WHERE loss_date >= DATE_FORMAT(CURDATE(),'%Y-%m-01'))                AS losses;

-- 11. RESTOCK HISTORY FOR ONE PRODUCT ------------------------------
SELECT type, quantity, note, created_at
FROM stock_movements
WHERE product_id = ? AND type = 'restock'
ORDER BY created_at DESC;

-- 12. BUSINESS INSIGHT — best seller of the week (used to generate
--     the "Product X is your best seller this week" card) ----------
SELECT p.name, SUM(si.quantity) AS units_sold, SUM(si.quantity*si.unit_price) AS revenue
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
JOIN products p ON p.id = si.product_id
WHERE s.sale_date >= CURDATE() - INTERVAL 7 DAY
GROUP BY p.id
ORDER BY units_sold DESC
LIMIT 1;
