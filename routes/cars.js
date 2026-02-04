const express = require('express');
const router = express.Router();

const carController = require('../controllers/carController');

// GET /api/v1/cars?status=AVAILABLE
router.get('/', carController.getCars);

module.exports = router;
