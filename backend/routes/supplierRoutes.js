// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const supplierController = require('../controllers/supplierController');

router.get('/', asyncHandler(supplierController.getAll));
router.get('/:id', asyncHandler(supplierController.getById));
router.post('/', asyncHandler(supplierController.create));
router.put('/:id', asyncHandler(supplierController.update));
router.delete('/:id', asyncHandler(supplierController.remove));

module.exports = router;
