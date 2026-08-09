// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const categoryController = require('../controllers/categoryController');

router.get('/', asyncHandler(categoryController.getAll));
router.get('/:id', asyncHandler(categoryController.getById));
router.post('/', asyncHandler(categoryController.create));
router.put('/:id', asyncHandler(categoryController.update));
router.delete('/:id', asyncHandler(categoryController.remove));

module.exports = router;
