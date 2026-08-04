// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const stockController = require('../controllers/stockController');

router.get('/', asyncHandler(stockController.getStockLevels));
router.post('/:productId/restock', asyncHandler(stockController.restock));
router.post('/:productId/adjust', asyncHandler(stockController.adjustStock));
router.get('/:productId/history', asyncHandler(stockController.getMovementHistory));

module.exports = router;
