// controllers/settingsController.js
const { pool } = require('../config/db');

// GET /api/settings
exports.getSettings = async (req, res) => {
  const [[settings]] = await pool.query(`SELECT * FROM settings WHERE id = 1`);
  if (!settings) {
    // Shouldn't happen if schema.sql / the migration ran, but don't 500 if it does.
    return res.json({
      success: true,
      data: {
        id: 1, store_name: 'My Store', contact_email: null, phone: null, address: null,
        currency_symbol: '₱', default_reorder_level: 10, low_stock_alerts_enabled: 1
      }
    });
  }
  res.json({ success: true, data: settings });
};

// PUT /api/settings
// Merges with the existing row so a partial payload can't accidentally
// blow away fields the caller didn't intend to touch (upserts otherwise
// fall back to hardcoded defaults for anything not sent).
exports.updateSettings = async (req, res) => {
  const [[existing]] = await pool.query(`SELECT * FROM settings WHERE id = 1`);
  const current = existing || {
    store_name: 'My Store', contact_email: null, phone: null, address: null,
    currency_symbol: '₱', default_reorder_level: 10, low_stock_alerts_enabled: 1
  };

  const merged = {
    store_name: req.body.store_name !== undefined ? req.body.store_name : current.store_name,
    contact_email: req.body.contact_email !== undefined ? req.body.contact_email : current.contact_email,
    phone: req.body.phone !== undefined ? req.body.phone : current.phone,
    address: req.body.address !== undefined ? req.body.address : current.address,
    currency_symbol: req.body.currency_symbol !== undefined ? req.body.currency_symbol : current.currency_symbol,
    default_reorder_level:
      req.body.default_reorder_level !== undefined ? req.body.default_reorder_level : current.default_reorder_level,
    low_stock_alerts_enabled:
      req.body.low_stock_alerts_enabled !== undefined
        ? (req.body.low_stock_alerts_enabled ? 1 : 0)
        : current.low_stock_alerts_enabled
  };

  if (!merged.store_name || !merged.store_name.trim()) {
    return res.status(400).json({ success: false, message: 'Store name cannot be empty' });
  }

  await pool.query(
    `INSERT INTO settings (id, store_name, contact_email, phone, address, currency_symbol, default_reorder_level, low_stock_alerts_enabled)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       store_name = VALUES(store_name),
       contact_email = VALUES(contact_email),
       phone = VALUES(phone),
       address = VALUES(address),
       currency_symbol = VALUES(currency_symbol),
       default_reorder_level = VALUES(default_reorder_level),
       low_stock_alerts_enabled = VALUES(low_stock_alerts_enabled)`,
    [
      merged.store_name, merged.contact_email, merged.phone, merged.address,
      merged.currency_symbol, merged.default_reorder_level, merged.low_stock_alerts_enabled
    ]
  );

  res.json({ success: true, message: 'Settings updated' });
};
