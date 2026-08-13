// controllers/dashboardController.js
const { pool } = require('../config/db');

// Small helper: percent change from `previous` to `current`, safe against /0
function percentChange(current, previous) {
  if (!previous || previous == 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10; // 1 decimal
}

// GET /api/dashboard/summary?period=today|week|month
// Sales/revenue/profit for the selected period, compared against the
// equivalent prior period (today vs yesterday, this week vs last week,
// this month vs last month) so the % change stays meaningful at any period.
exports.getSummary = async (req, res) => {
  const period = req.query.period === 'week' || req.query.period === 'month' ? req.query.period : 'today';
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 1;

  // Current period: the last `days` days including today.
  const [[current]] = await pool.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total_amount),0) AS revenue
     FROM sales WHERE sale_date >= CURDATE() - INTERVAL ? DAY`,
    [days - 1]
  );
  // Previous period: the same number of days immediately before the current period.
  const [[previous]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount),0) AS revenue
     FROM sales
     WHERE sale_date >= CURDATE() - INTERVAL ? DAY AND sale_date < CURDATE() - INTERVAL ? DAY`,
    [days * 2 - 1, days - 1]
  );

  const [[currentProfit]] = await pool.query(
    `SELECT COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity),0) AS profit
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= CURDATE() - INTERVAL ? DAY`,
    [days - 1]
  );
  const [[previousProfit]] = await pool.query(
    `SELECT COALESCE(SUM((si.unit_price - si.unit_cost) * si.quantity),0) AS profit
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date >= CURDATE() - INTERVAL ? DAY AND s.sale_date < CURDATE() - INTERVAL ? DAY`,
    [days * 2 - 1, days - 1]
  );

  const [[lowStock]] = await pool.query(
    `SELECT COUNT(*) AS count FROM products WHERE current_stock <= reorder_level AND is_active = 1`
  );

  // Note: totalSalesToday and totalRevenueToday both come from sales.total_amount
  // for now (they're the same figure in a simple retail flow). They're kept as
  // separate fields so refunds/discounts can be layered in later — e.g. Sales
  // = gross order value, Revenue = amount actually collected — without a
  // breaking API change on the frontend. Field names keep the "Today" suffix
  // for backwards compatibility even though `period` can now widen the window.
  res.json({
    success: true,
    data: {
      period,
      totalSalesToday: current.revenue,
      totalSalesChangePct: percentChange(current.revenue, previous.revenue),
      totalTransactionsToday: current.count,
      totalRevenueToday: current.revenue,
      totalRevenueChangePct: percentChange(current.revenue, previous.revenue),
      totalProfitToday: currentProfit.profit,
      totalProfitChangePct: percentChange(currentProfit.profit, previousProfit.profit),
      lowStockItems: lowStock.count
    }
  });
};

// GET /api/dashboard/profit-loss?range=week|month
// Feeds the Revenue / Profit / Expenses area chart
exports.getProfitLossTrend = async (req, res) => {
  const range = req.query.range === 'month' ? 29 : 6; // days back

  const [rows] = await pool.query(
    `SELECT
        DATE(s.sale_date) AS day,
        SUM(si.quantity * si.unit_price) AS revenue,
        SUM(si.quantity * (si.unit_price - si.unit_cost)) AS profit
     FROM sales s
     JOIN sale_items si ON si.sale_id = s.id
     WHERE s.sale_date >= CURDATE() - INTERVAL ? DAY
     GROUP BY DATE(s.sale_date)
     ORDER BY day ASC`,
    [range]
  );

  const [expenseRows] = await pool.query(
    `SELECT expense_date AS day, SUM(amount) AS expenses
     FROM expenses
     WHERE expense_date >= CURDATE() - INTERVAL ? DAY
     GROUP BY expense_date`,
    [range]
  );
  const expenseMap = Object.fromEntries(
    expenseRows.map(r => [r.day.toISOString().slice(0, 10), r.expenses])
  );

  const data = rows.map(r => ({
    day: r.day.toISOString().slice(0, 10),
    revenue: r.revenue,
    profit: r.profit,
    expenses: expenseMap[r.day.toISOString().slice(0, 10)] || 0
  }));

  res.json({ success: true, data });
};

// GET /api/dashboard/top-selling?limit=5
exports.getTopSelling = async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.image_url,
            SUM(si.quantity) AS sold,
            SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.sale_date >= CURDATE() - INTERVAL 7 DAY
     GROUP BY p.id, p.name, p.image_url
     ORDER BY sold DESC
     LIMIT ?`,
    [limit]
  );
  res.json({ success: true, data: rows });
};

// GET /api/dashboard/low-stock
exports.getLowStockAlerts = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, image_url, current_stock,
            CASE WHEN current_stock = 0 THEN 'Out of Stock' ELSE 'Low Stock' END AS status
     FROM products
     WHERE current_stock <= reorder_level AND is_active = 1
     ORDER BY current_stock ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/dashboard/insights
// Simple rule-based "business insight" cards (best seller, low stock warning,
// profit trend, underperforming product). Swap the rules out for something
// smarter later without changing the response shape.
exports.getInsights = async (req, res) => {
  const insights = [];

  const [[bestSeller]] = await pool.query(
    `SELECT p.name, SUM(si.quantity) AS units_sold, SUM(si.quantity*si.unit_price) AS revenue
     FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id
     WHERE s.sale_date >= CURDATE() - INTERVAL 7 DAY
     GROUP BY p.id ORDER BY units_sold DESC LIMIT 1`
  );
  if (bestSeller) {
    insights.push({
      type: 'best_seller',
      title: `${bestSeller.name} is your best seller this week.`,
      detail: `Sold ${bestSeller.units_sold} items, generating ₱${Number(bestSeller.revenue).toLocaleString()}.`
    });
  }

  const [[lowStock]] = await pool.query(
    `SELECT COUNT(*) AS count FROM products WHERE current_stock <= reorder_level AND is_active = 1`
  );
  if (lowStock.count > 0) {
    insights.push({
      type: 'low_stock',
      title: `${lowStock.count} products are running low in stock.`,
      detail: 'Please restock to avoid missing sales.'
    });
  }

  const [[todayProfit]] = await pool.query(
    `SELECT COALESCE(SUM((si.unit_price - si.unit_cost)*si.quantity),0) AS profit
     FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE DATE(s.sale_date)=CURDATE()`
  );
  const [[yesterdayProfit]] = await pool.query(
    `SELECT COALESCE(SUM((si.unit_price - si.unit_cost)*si.quantity),0) AS profit
     FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE DATE(s.sale_date)=CURDATE()-INTERVAL 1 DAY`
  );
  const change = percentChange(todayProfit.profit, yesterdayProfit.profit);
  insights.push({
    type: change >= 0 ? 'profit_up' : 'profit_down',
    title: change >= 0 ? `Profit has increased by ${change}%.` : `Profit has dropped by ${Math.abs(change)}%.`,
    detail: change >= 0 ? 'Great job! Your business is growing.' : 'Review pricing and expenses this week.'
  });

  const [[worstSeller]] = await pool.query(
    `SELECT p.name, COALESCE(SUM(si.quantity),0) AS units_sold
     FROM products p
     LEFT JOIN sale_items si ON si.product_id = p.id
     LEFT JOIN sales s ON s.id = si.sale_id AND s.sale_date >= CURDATE() - INTERVAL 7 DAY
     WHERE p.is_active = 1
     GROUP BY p.id ORDER BY units_sold ASC LIMIT 1`
  );
  if (worstSeller) {
    insights.push({
      type: 'low_sales',
      title: `${worstSeller.name} has low sales.`,
      detail: 'Consider a promotion or price adjustment.'
    });
  }

  res.json({ success: true, data: insights });
};
