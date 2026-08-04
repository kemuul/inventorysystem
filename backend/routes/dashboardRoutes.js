// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', asyncHandler(dashboardController.getSummary));
router.get('/profit-loss', asyncHandler(dashboardController.getProfitLossTrend));
router.get('/top-selling', asyncHandler(dashboardController.getTopSelling));
router.get('/low-stock', asyncHandler(dashboardController.getLowStockAlerts));
router.get('/insights', asyncHandler(dashboardController.getInsights));

module.exports = router;
