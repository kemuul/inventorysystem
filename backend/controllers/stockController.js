// controllers/stockController.js
const { pool } = require('../config/db');

// GET /api/stocks
// Full stock list with computed status, used by the Stocks page.
exports.getStockLevels = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, sku, name, initial_stock, current_stock, reorder_level,
            (initial_stock - current_stock) AS sold_quantity,
            CASE
              WHEN current_stock = 0 THEN 'Out of Stock'
              WHEN current_stock <= reorder_level THEN 'Low Stock'
              ELSE 'In Stock'
            END AS status
     FROM products
     WHERE is_active = 1
     ORDER BY current_stock ASC`
  );
  res.json({ success: true, data: rows });
};

// POST /api/stocks/:productId/restock
// Body: { quantity, note, created_by }
// Increases current_stock and writes an audit row to stock_movements.
exports.restock = async (req, res) => {
  const { productId } = req.params;
  const { quantity, note, created_by } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`UPDATE products SET current_stock = current_stock + ? WHERE id = ?`, [quantity, productId]);
    await conn.query(
      `INSERT INTO stock_movements (product_id, type, quantity, note, created_by) VALUES (?, 'restock', ?, ?, ?)`,
      [productId, quantity, note || null, created_by || null]
    );

    await conn.commit();
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// POST /api/stocks/:productId/adjust
// For damaged / expired / manual adjustments. Body: { type, quantity, note, created_by }
// type must be one of: damaged, expired, adjustment
exports.adjustStock = async (req, res) => {
  const { productId } = req.params;
  const { type, quantity, note, created_by } = req.body;
  const allowed = ['damaged', 'expired', 'adjustment'];

  if (!allowed.includes(type)) {
    return res.status(400).json({ success: false, message: `type must be one of ${allowed.join(', ')}` });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE products SET current_stock = GREATEST(current_stock - ?, 0) WHERE id = ?`,
      [quantity, productId]
    );
    await conn.query(
      `INSERT INTO stock_movements (product_id, type, quantity, note, created_by) VALUES (?, ?, ?, ?, ?)`,
      [productId, type, quantity, note || null, created_by || null]
    );

    // damaged/expired stock is also a financial loss — log it for P&L
    if (type === 'damaged' || type === 'expired') {
      const [[product]] = await conn.query(`SELECT cost_price FROM products WHERE id = ?`, [productId]);
      await conn.query(
        `INSERT INTO losses (product_id, quantity, reason, cost_impact, loss_date, notes)
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [productId, quantity, type, product.cost_price * quantity, note || null]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Stock adjusted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/stocks/:productId/history
// Full restock / adjustment audit trail for one product.
exports.getMovementHistory = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT sm.*, u.name AS created_by_name
     FROM stock_movements sm
     LEFT JOIN users u ON u.id = sm.created_by
     WHERE sm.product_id = ?
     ORDER BY sm.created_at DESC`,
    [req.params.productId]
  );
  res.json({ success: true, data: rows });
};
