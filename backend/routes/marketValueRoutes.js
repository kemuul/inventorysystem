// routes/marketValueRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const marketValueController = require('../controllers/marketValueController');

router.get('/', asyncHandler(marketValueController.getComparison));
router.get('/:productId/trend', asyncHandler(marketValueController.getTrend));
router.post('/:productId', asyncHandler(marketValueController.recordMarketPrice));

module.exports = router;
