// controllers/salesController.js
const { pool } = require('../config/db');

// GET /api/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getAll = async (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT * FROM sales WHERE 1=1`;
  const params = [];
  if (from) { sql += ` AND sale_date >= ?`; params.push(from); }
  if (to) { sql += ` AND sale_date <= ?`; params.push(to); }
  sql += ` ORDER BY sale_date DESC`;

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
};

// GET /api/sales/:id  (with line items)
exports.getById = async (req, res) => {
  const [[sale]] = await pool.query(`SELECT * FROM sales WHERE id = ?`, [req.params.id]);
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

  const [items] = await pool.query(
    `SELECT si.*, p.name AS product_name FROM sale_items si
     JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`,
    [req.params.id]
  );
  res.json({ success: true, data: { ...sale, items } });
};

// POST /api/sales
// Body: { customer_name, created_by, items: [{ product_id, quantity }] }
// Looks up each product's live cost/selling price, snapshots it onto the
// sale_item row, decrements stock, and logs a 'sale' stock_movement —
// all inside one transaction so partial sales can never happen.
exports.create = async (req, res) => {
  const { customer_name, created_by, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'items[] is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const [[product]] = await conn.query(
        `SELECT id, name, cost_price, selling_price, current_stock FROM products WHERE id = ? FOR UPDATE`,
        [item.product_id]
      );
      if (!product) throw Object.assign(new Error(`Product ${item.product_id} not found`), { status: 404 });
      if (product.current_stock < item.quantity) {
        throw Object.assign(new Error(`Not enough stock for ${product.name}`), { status: 400 });
      }

      const subtotal = product.selling_price * item.quantity;
      totalAmount += subtotal;
      resolvedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.selling_price,
        unit_cost: product.cost_price
      });
    }

    const [saleResult] = await conn.query(
      `INSERT INTO sales (customer_name, total_amount, created_by) VALUES (?, ?, ?)`,
      [customer_name || 'Walk-in Customer', totalAmount, created_by || null]
    );
    const saleId = saleResult.insertId;

    for (const ri of resolvedItems) {
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, ri.product_id, ri.quantity, ri.unit_price, ri.unit_cost]
      );
      await conn.query(`UPDATE products SET current_stock = current_stock - ? WHERE id = ?`, [ri.quantity, ri.product_id]);
      await conn.query(
        `INSERT INTO stock_movements (product_id, type, quantity, note, created_by) VALUES (?, 'sale', ?, ?, ?)`,
        [ri.product_id, ri.quantity, `Sale #${saleId}`, created_by || null]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: saleId, total_amount: totalAmount } });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
