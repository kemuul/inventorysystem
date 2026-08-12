// controllers/reportsController.js
const { pool } = require('../config/db');

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
// Defaults to the last 30 days when no range is given.
exports.getSalesReport = async (req, res) => {
  const from = req.query.from || isoDaysAgo(29);
  const to = req.query.to || isoDaysAgo(0);

  const [[summary]] = await pool.query(
    `SELECT COUNT(DISTINCT s.id) AS orders,
            COALESCE(SUM(si.quantity * si.unit_price), 0) AS revenue,
            COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) AS profit,
            COALESCE(SUM(si.quantity), 0) AS units_sold
     FROM sales s
     JOIN sale_items si ON si.sale_id = s.id
     WHERE DATE(s.sale_date) BETWEEN ? AND ?`,
    [from, to]
  );

  const [byDayRaw] = await pool.query(
    `SELECT DATE(s.sale_date) AS day,
            SUM(si.quantity * si.unit_price) AS revenue,
            SUM(si.quantity * (si.unit_price - si.unit_cost)) AS profit
     FROM sales s
     JOIN sale_items si ON si.sale_id = s.id
     WHERE DATE(s.sale_date) BETWEEN ? AND ?
     GROUP BY DATE(s.sale_date)
     ORDER BY day ASC`,
    [from, to]
  );
  const byDay = byDayRaw.map((r) => ({ ...r, day: r.day.toISOString().slice(0, 10) }));

  const [topProducts] = await pool.query(
    `SELECT p.id, p.name,
            SUM(si.quantity) AS units_sold,
            SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE DATE(s.sale_date) BETWEEN ? AND ?
     GROUP BY p.id, p.name
     ORDER BY units_sold DESC
     LIMIT 10`,
    [from, to]
  );

  res.json({ success: true, data: { from, to, summary, byDay, topProducts } });
};

// GET /api/reports/inventory
// Snapshot of current stock valued at both cost and selling price.
exports.getInventoryReport = async (req, res) => {
  const [items] = await pool.query(
    `SELECT p.id, p.name, c.name AS category_name, p.current_stock, p.cost_price, p.selling_price,
            (p.current_stock * p.cost_price) AS stock_value_at_cost,
            (p.current_stock * p.selling_price) AS stock_value_at_selling
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1
     ORDER BY stock_value_at_cost DESC`
  );

  const [[totals]] = await pool.query(
    `SELECT COALESCE(SUM(current_stock * cost_price), 0) AS total_cost_value,
            COALESCE(SUM(current_stock * selling_price), 0) AS total_selling_value,
            COALESCE(SUM(current_stock), 0) AS total_units
     FROM products WHERE is_active = 1`
  );

  res.json({ success: true, data: { items, totals } });
};
