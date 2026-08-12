// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const searchController = require('../controllers/searchController');

router.get('/', asyncHandler(searchController.search));

module.exports = router;
