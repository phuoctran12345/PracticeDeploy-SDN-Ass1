const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

// Tất cả route booking đều cần đăng nhập
router.use(auth);

// GET /api/v1/bookings – Customer: chỉ của mình; Admin: có thể filter userId
router.get('/', bookingController.getBookings);

// POST /api/v1/bookings – Chỉ user đã login mới tạo booking
router.post('/', bookingController.createBooking);

// Owner: quản lý xe của mình
router.get('/owner/bookings', authorize('owner'), bookingController.getOwnerBookings);

// Admin: xem toàn hệ thống
router.get('/admin/bookings/summary', authorize('admin'), bookingController.getAdminBookingsSummary);

// Hủy booking – chỉ chủ booking hoặc admin
router.patch('/:id/cancel', bookingController.cancelBooking);

// Chi tiết booking – phân quyền trong controller
router.get('/:id', bookingController.getBookingById);

module.exports = router;
