// server.js — application entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const salesRoutes = require('./routes/salesRoutes');
const profitLossRoutes = require('./routes/profitLossRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const marketValueRoutes = require('./routes/marketValueRoutes');

const app = express();

// ---- Global middleware ----
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || '*').split(',') }));
app.use(express.json());

// ---- Health check ----
app.get('/api/health', (req, res) => res.json({ success: true, message: 'InventoryPro API is running' }));

// ---- Feature routes ----
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/market-value', marketValueRoutes);

// ---- 404 fallback ----
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ---- Central error handler (must be last) ----
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 InventoryPro API listening on http://localhost:${PORT}`);
  await testConnection();
});
