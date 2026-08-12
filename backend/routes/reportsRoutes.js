// routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const reportsController = require('../controllers/reportsController');

router.get('/sales', asyncHandler(reportsController.getSalesReport));
router.get('/inventory', asyncHandler(reportsController.getInventoryReport));

module.exports = router;
