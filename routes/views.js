/**
 * Route View (EJS) – Trang web cho Car, Booking, User (UI từ Chương 1–9)
 */
const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const requireWebAuth = require('../middlewares/requireWebAuth');
const requireRole = require('../middlewares/requireRole');

// Trang chủ
router.get('/', viewController.home);

// ----- Auth (web – session) -----
router.get('/login', viewController.showLogin);
router.get('/register', viewController.showRegister);
router.post('/login', viewController.postLogin);
router.post('/register', viewController.postRegister);
router.get('/logout', viewController.logout);

// ----- Car -----
router.get('/cars', viewController.carList);
router.get('/cars/:id', viewController.carDetail);

// ----- Booking / Rentals -----
router.get('/bookings', viewController.bookingList);
router.get('/bookings/new', requireWebAuth, viewController.bookingCreateForm);
router.post('/bookings', requireWebAuth, viewController.bookingCreate);
router.get('/bookings/:id', viewController.bookingDetail);

// ----- User (Customer) -----
router.get('/users/:id', viewController.userProfile);
router.get('/users/:id/bookings', viewController.userBookings);

// ----- Owner (chỉ role owner hoặc admin) -----
router.get('/owner/bookings', requireWebAuth, requireRole('owner', 'admin'), viewController.ownerBookings);

// ----- Admin (chỉ role admin) -----
router.get('/admin/summary', requireWebAuth, requireRole('admin'), viewController.adminSummary);
router.get('/admin/bookings', requireWebAuth, requireRole('admin'), viewController.adminBookingList);
router.post('/admin/bookings/:id/confirm', requireWebAuth, requireRole('admin'), viewController.adminConfirmBooking);
router.post('/admin/bookings/:id/cancel', requireWebAuth, requireRole('admin'), viewController.adminCancelBooking);

module.exports = router;
