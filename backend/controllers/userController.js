// controllers/userController.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

// GET /api/users
// Never returns password_hash.
exports.getAll = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, created_at FROM users ORDER BY name ASC`
  );
  res.json({ success: true, data: rows });
};

// GET /api/users/:id
exports.getById = async (req, res) => {
  const [[user]] = await pool.query(
    `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
    [req.params.id]
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};

// POST /api/users
exports.create = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const [[existing]] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role === 'admin' ? 'admin' : 'staff']
  );
  res.status(201).json({ success: true, data: { id: result.insertId } });
};

// PUT /api/users/:id
// Password is optional here — only touched if the request includes a new one.
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const [[existing]] = await pool.query(`SELECT id FROM users WHERE id = ?`, [id]);
  if (!existing) return res.status(404).json({ success: false, message: 'User not found' });

  if (email !== undefined) {
    const [[emailTaken]] = await pool.query(`SELECT id FROM users WHERE email = ? AND id != ?`, [email, id]);
    if (emailTaken) return res.status(409).json({ success: false, message: 'A user with that email already exists' });
  }

  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (role !== undefined) { updates.push('role = ?'); values.push(role === 'admin' ? 'admin' : 'staff'); }
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    updates.push('password_hash = ?');
    values.push(await bcrypt.hash(password, SALT_ROUNDS));
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  values.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ success: true, message: 'User updated' });
};

// DELETE /api/users/:id
exports.remove = async (req, res) => {
  await pool.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);
  res.json({ success: true, message: 'User deleted' });
};
