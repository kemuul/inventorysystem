// controllers/supplierController.js
const { pool } = require('../config/db');

// GET /api/suppliers
exports.getAll = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at,
            COUNT(p.id) AS product_count
     FROM suppliers s
     LEFT JOIN products p ON p.supplier_id = s.id AND p.is_active = 1
     GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at
     ORDER BY s.name ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/suppliers/:id
exports.getById = async (req, res) => {
  const [[supplier]] = await pool.query(`SELECT * FROM suppliers WHERE id = ?`, [req.params.id]);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
};

// POST /api/suppliers
exports.create = async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });

  const [result] = await pool.query(
    `INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
    [name, contact_person || null, phone || null, email || null, address || null]
  );
  res.status(201).json({ success: true, data: { id: result.insertId } });
};

// PUT /api/suppliers/:id
exports.update = async (req, res) => {
  const { id } = req.params;
  const [[existing]] = await pool.query(`SELECT id FROM suppliers WHERE id = ?`, [id]);
  if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found' });

  const fields = ['name', 'contact_person', 'phone', 'email', 'address'];
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
  await pool.query(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true, message: 'Supplier updated' });
};

// DELETE /api/suppliers/:id
// Hard delete is safe: products.supplier_id has ON DELETE SET NULL.
exports.remove = async (req, res) => {
  await pool.query(`DELETE FROM suppliers WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'Supplier deleted' });
};
