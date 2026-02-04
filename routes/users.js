const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

// GET /api/v1/users/:id/bookings – Chỉ user đã login; Customer chỉ xem của mình
router.get('/:id/bookings', auth, bookingController.getUserBookings);

module.exports = router;
