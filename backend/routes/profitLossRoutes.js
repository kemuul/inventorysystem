// routes/profitLossRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const profitLossController = require('../controllers/profitLossController');

router.get('/summary', asyncHandler(profitLossController.getSummary));
router.get('/trend', asyncHandler(profitLossController.getTrend));
router.get('/expenses', asyncHandler(profitLossController.getExpenses));
router.post('/expenses', asyncHandler(profitLossController.addExpense));
router.get('/losses', asyncHandler(profitLossController.getLosses));

module.exports = router;
