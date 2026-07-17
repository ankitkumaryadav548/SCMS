const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/booking.controller');

// ── Stats (admin) ──────────────────────────────────────────
router.get('/stats',         protect, authorize('Admin'), ctrl.getStats);

// ── Parking slots ──────────────────────────────────────────
router.get('/parking-slots', protect, ctrl.getParkingSlots);

// ── Queue monitor (admin) ──────────────────────────────────
router.get('/queue',         protect, authorize('Admin'), ctrl.getQueue);

// ── All bookings / create booking ─────────────────────────
router.route('/')
  .get(protect, ctrl.getBookings)
  .post(protect, ctrl.createBooking);

// ── Admin approve / reject ─────────────────────────────────
router.patch('/:id/approve', protect, authorize('Admin'), ctrl.approveBooking);
router.patch('/:id/reject',  protect, authorize('Admin'), ctrl.rejectBooking);

// ── Citizen cancel ─────────────────────────────────────────
router.patch('/:id/cancel',  protect, ctrl.cancelBooking);

module.exports = router;
