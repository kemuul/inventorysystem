// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const productController = require('../controllers/productController');

router.get('/', asyncHandler(productController.getAll));
router.get('/:id', asyncHandler(productController.getById));
router.post('/', asyncHandler(productController.create));
router.put('/:id', asyncHandler(productController.update));
router.delete('/:id', asyncHandler(productController.remove));

module.exports = router;
