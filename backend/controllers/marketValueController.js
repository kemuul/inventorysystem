// controllers/marketValueController.js
const { pool } = require('../config/db');

// GET /api/market-value
// Compares every active product's selling price against its market price
// and returns a plain-language suggestion.
exports.getComparison = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, selling_price, market_price,
            (selling_price - market_price) AS price_gap,
            ROUND((selling_price - market_price) / NULLIF(market_price,0) * 100, 1) AS gap_percent
     FROM products WHERE is_active = 1 AND market_price IS NOT NULL
     ORDER BY ABS(selling_price - market_price) DESC`
  );

  const data = rows.map((p) => ({
    ...p,
    suggestion:
      p.selling_price > p.market_price
        ? 'Priced above market — consider lowering to stay competitive'
        : p.selling_price < p.market_price
        ? 'Priced below market — there is room to raise the price'
        : 'Matches market price'
  }));

  res.json({ success: true, data });
};

// GET /api/market-value/:productId/trend
// Market price snapshots over time, for the market-vs-selling trend chart.
exports.getTrend = async (req, res) => {
  const { productId } = req.params;

  const [marketRows] = await pool.query(
    `SELECT market_price, source, recorded_at FROM market_prices WHERE product_id = ? ORDER BY recorded_at ASC`,
    [productId]
  );
  const [sellingRows] = await pool.query(
    `SELECT selling_price, changed_at FROM price_history WHERE product_id = ? ORDER BY changed_at ASC`,
    [productId]
  );

  res.json({ success: true, data: { market: marketRows, selling: sellingRows } });
};

// POST /api/market-value/:productId
// Body: { market_price, source }
// Records a new market price snapshot and updates the live value on products.
exports.recordMarketPrice = async (req, res) => {
  const { productId } = req.params;
  const { market_price, source } = req.body;

  if (!market_price) {
    return res.status(400).json({ success: false, message: 'market_price is required' });
  }

  await pool.query(
    `INSERT INTO market_prices (product_id, market_price, source) VALUES (?, ?, ?)`,
    [productId, market_price, source || 'Manual entry']
  );
  await pool.query(`UPDATE products SET market_price = ? WHERE id = ?`, [market_price, productId]);

  res.status(201).json({ success: true, message: 'Market price recorded' });
};
