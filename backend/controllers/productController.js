// controllers/productController.js
const { pool } = require('../config/db');

// GET /api/products
exports.getAll = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = 1
     ORDER BY p.name ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/products/:id
exports.getById = async (req, res) => {
  const [[product]] = await pool.query(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

// POST /api/products
exports.create = async (req, res) => {
  const {
    sku, name, category_id, supplier_id, cost_price, selling_price,
    market_price, initial_stock, reorder_level, image_url
  } = req.body;

  if (!sku || !name) {
    return res.status(400).json({ success: false, message: 'sku and name are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO products
      (sku, name, category_id, supplier_id, cost_price, selling_price, market_price,
       initial_stock, current_stock, reorder_level, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, category_id || null, supplier_id || null, cost_price || 0, selling_price || 0,
     market_price || null, initial_stock || 0, initial_stock || 0, reorder_level || 10, image_url || null]
  );

  // First price_history entry so the trend chart has a starting point
  await pool.query(
    `INSERT INTO price_history (product_id, cost_price, selling_price, changed_by) VALUES (?, ?, ?, ?)`,
    [result.insertId, cost_price || 0, selling_price || 0, req.body.changed_by || null]
  );

  res.status(201).json({ success: true, data: { id: result.insertId } });
};

// PUT /api/products/:id
// If cost_price or selling_price changed, automatically logs to price_history.
exports.update = async (req, res) => {
  const { id } = req.params;
  const [[existing]] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

  const fields = [
    'name', 'category_id', 'supplier_id', 'cost_price', 'selling_price',
    'market_price', 'reorder_level', 'image_url', 'is_active'
  ];
  const updates = [];
  const values = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  });
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  values.push(id);
  await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

  const priceChanged =
    (req.body.cost_price !== undefined && Number(req.body.cost_price) !== Number(existing.cost_price)) ||
    (req.body.selling_price !== undefined && Number(req.body.selling_price) !== Number(existing.selling_price));

  if (priceChanged) {
    await pool.query(
      `INSERT INTO price_history (product_id, cost_price, selling_price, changed_by) VALUES (?, ?, ?, ?)`,
      [
        id,
        req.body.cost_price ?? existing.cost_price,
        req.body.selling_price ?? existing.selling_price,
        req.body.changed_by || null
      ]
    );
  }

  res.json({ success: true, message: 'Product updated' });
};

// DELETE /api/products/:id  (soft delete — keeps history intact)
exports.remove = async (req, res) => {
  await pool.query(`UPDATE products SET is_active = 0 WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'Product deactivated' });
};
