// controllers/pricingController.js
const { pool } = require('../config/db');

// GET /api/pricing
// Current price + auto-calculated profit margin per product.
exports.getAllPricing = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, cost_price, selling_price,
            (selling_price - cost_price) AS profit_per_unit,
            ROUND((selling_price - cost_price) / NULLIF(cost_price,0) * 100, 1) AS margin_percent
     FROM products WHERE is_active = 1 ORDER BY name ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/pricing/:productId/history
// Full price history + whether the latest change was an increase or decrease.
exports.getPriceHistory = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cost_price, selling_price, changed_at
     FROM price_history WHERE product_id = ? ORDER BY changed_at ASC`,
    [req.params.productId]
  );

  let trend = 'no_change';
  if (rows.length >= 2) {
    const prev = rows[rows.length - 2].selling_price;
    const curr = rows[rows.length - 1].selling_price;
    trend = curr > prev ? 'increased' : curr < prev ? 'decreased' : 'no_change';
  }

  res.json({ success: true, data: { history: rows, trend } });
};

// PUT /api/pricing/:productId
// Dedicated endpoint for updating just cost/selling price (writes to price_history).
exports.updatePrice = async (req, res) => {
  const { cost_price, selling_price, changed_by } = req.body;
  const { productId } = req.params;

  if (cost_price === undefined && selling_price === undefined) {
    return res.status(400).json({ success: false, message: 'Provide cost_price and/or selling_price' });
  }

  const [[product]] = await pool.query(`SELECT * FROM products WHERE id = ?`, [productId]);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const newCost = cost_price ?? product.cost_price;
  const newSelling = selling_price ?? product.selling_price;

  await pool.query(`UPDATE products SET cost_price = ?, selling_price = ? WHERE id = ?`, [newCost, newSelling, productId]);
  await pool.query(
    `INSERT INTO price_history (product_id, cost_price, selling_price, changed_by) VALUES (?, ?, ?, ?)`,
    [productId, newCost, newSelling, changed_by || null]
  );

  res.json({ success: true, message: 'Price updated', data: { cost_price: newCost, selling_price: newSelling } });
};
