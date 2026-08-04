// routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const salesController = require('../controllers/salesController');

router.get('/', asyncHandler(salesController.getAll));
router.get('/:id', asyncHandler(salesController.getById));
router.post('/', asyncHandler(salesController.create));

module.exports = router;
