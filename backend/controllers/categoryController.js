// controllers/categoryController.js
const { pool } = require('../config/db');

// GET /api/categories
// Includes a live product_count per category — useful for the Categories page
// table without a separate round trip.
exports.getAll = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at,
            COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     GROUP BY c.id, c.name, c.description, c.created_at
     ORDER BY c.name ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/categories/:id
exports.getById = async (req, res) => {
  const [[category]] = await pool.query(`SELECT * FROM categories WHERE id = ?`, [req.params.id]);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
};

// POST /api/categories
exports.create = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });

  const [result] = await pool.query(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [name, description || null]
  );
  res.status(201).json({ success: true, data: { id: result.insertId } });
};

// PUT /api/categories/:id
exports.update = async (req, res) => {
  const { id } = req.params;
  const [[existing]] = await pool.query(`SELECT id FROM categories WHERE id = ?`, [id]);
  if (!existing) return res.status(404).json({ success: false, message: 'Category not found' });

  // Only touch fields actually present in the request body — this is what
  // lets someone deliberately clear `description` (send '') without a
  // COALESCE silently falling back to the old value.
  const fields = ['name', 'description'];
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
  await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true, message: 'Category updated' });
};

// DELETE /api/categories/:id
// Hard delete is safe here: products.category_id has ON DELETE SET NULL,
// so existing products just lose their category label instead of breaking.
exports.remove = async (req, res) => {
  await pool.query(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'Category deleted' });
};
