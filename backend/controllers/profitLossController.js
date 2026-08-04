// controllers/profitLossController.js
const { pool } = require('../config/db');

// GET /api/profit-loss/summary?period=today|week|month
exports.getSummary = async (req, res) => {
  const period = req.query.period || 'month';
  const interval = period === 'today' ? '0 DAY' : period === 'week' ? '6 DAY' : '29 DAY';

  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(si.quantity * si.unit_price),0) AS total
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= CURDATE() - INTERVAL ${interval}`
  );
  const [[grossProfit]] = await pool.query(
    `SELECT COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)),0) AS total
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= CURDATE() - INTERVAL ${interval}`
  );
  const [[expenses]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_date >= CURDATE() - INTERVAL ${interval}`
  );
  const [[losses]] = await pool.query(
    `SELECT COALESCE(SUM(cost_impact),0) AS total FROM losses WHERE loss_date >= CURDATE() - INTERVAL ${interval}`
  );

  const netProfit = grossProfit.total - expenses.total - losses.total;

  res.json({
    success: true,
    data: {
      revenue: revenue.total,
      grossProfit: grossProfit.total,
      expenses: expenses.total,
      losses: losses.total,
      netProfit
    }
  });
};

// GET /api/profit-loss/trend?range=week|month  (for the dashboard chart)
exports.getTrend = async (req, res) => {
  const days = req.query.range === 'month' ? 29 : 6;
  const [rows] = await pool.query(
    `SELECT DATE(s.sale_date) AS day,
            SUM(si.quantity * si.unit_price) AS revenue,
            SUM(si.quantity * (si.unit_price - si.unit_cost)) AS profit
     FROM sales s JOIN sale_items si ON si.sale_id = s.id
     WHERE s.sale_date >= CURDATE() - INTERVAL ? DAY
     GROUP BY DATE(s.sale_date) ORDER BY day ASC`,
    [days]
  );
  res.json({ success: true, data: rows });
};

// GET /api/profit-loss/expenses
exports.getExpenses = async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM expenses ORDER BY expense_date DESC`);
  res.json({ success: true, data: rows });
};

// POST /api/profit-loss/expenses
exports.addExpense = async (req, res) => {
  const { category, description, amount, expense_date } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ success: false, message: 'category and amount are required' });
  }
  const [result] = await pool.query(
    `INSERT INTO expenses (category, description, amount, expense_date) VALUES (?, ?, ?, ?)`,
    [category, description || null, amount, expense_date || new Date()]
  );
  res.status(201).json({ success: true, data: { id: result.insertId } });
};

// GET /api/profit-loss/losses
exports.getLosses = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.*, p.name AS product_name FROM losses l
     JOIN products p ON p.id = l.product_id ORDER BY l.loss_date DESC`
  );
  res.json({ success: true, data: rows });
};
