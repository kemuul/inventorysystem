// controllers/searchController.js
const { pool } = require('../config/db');

// GET /api/search?q=...
// Powers the Topbar search box. Returns a handful of matches per entity
// type rather than one flat list, so the dropdown can group them.
exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ success: true, data: { products: [], categories: [], suppliers: [] } });
  }

  const like = `%${q}%`;

  const [products] = await pool.query(
    `SELECT id, name, sku, current_stock FROM products
     WHERE is_active = 1 AND (name LIKE ? OR sku LIKE ?)
     ORDER BY name ASC LIMIT 5`,
    [like, like]
  );
  const [categories] = await pool.query(
    `SELECT id, name FROM categories WHERE name LIKE ? ORDER BY name ASC LIMIT 5`,
    [like]
  );
  const [suppliers] = await pool.query(
    `SELECT id, name FROM suppliers WHERE name LIKE ? ORDER BY name ASC LIMIT 5`,
    [like]
  );

  res.json({ success: true, data: { products, categories, suppliers } });
};
