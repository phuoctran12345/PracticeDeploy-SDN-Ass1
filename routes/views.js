/**
 * Route View (EJS) – Trang web cho Car, Booking, User (UI từ Chương 1–9)
 */
const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');

// Trang chủ
router.get('/', viewController.home);

// ----- Car -----
router.get('/cars', viewController.carList);
router.get('/cars/:id', viewController.carDetail);

// ----- Booking / Rentals -----
router.get('/bookings', viewController.bookingList);
router.get('/bookings/new', viewController.bookingCreateForm);
router.post('/bookings', viewController.bookingCreate);
router.get('/bookings/:id', viewController.bookingDetail);

// ----- User (Customer) -----
router.get('/users/:id', viewController.userProfile);
router.get('/users/:id/bookings', viewController.userBookings);

// ----- Owner -----
router.get('/owner/bookings', viewController.ownerBookings);

// ----- Admin -----
router.get('/admin/summary', viewController.adminSummary);

module.exports = router;
