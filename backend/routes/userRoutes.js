// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

router.get('/', asyncHandler(userController.getAll));
router.get('/:id', asyncHandler(userController.getById));
router.post('/', asyncHandler(userController.create));
router.put('/:id', asyncHandler(userController.update));
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;
