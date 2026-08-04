// routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const pricingController = require('../controllers/pricingController');

router.get('/', asyncHandler(pricingController.getAllPricing));
router.get('/:productId/history', asyncHandler(pricingController.getPriceHistory));
router.put('/:productId', asyncHandler(pricingController.updatePrice));

module.exports = router;
