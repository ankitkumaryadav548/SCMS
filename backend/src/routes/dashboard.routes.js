// src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth'); // assuming protect middleware exists

// All routes are protected – only admin users can access
router.use(protect);

router.get('/kpis', dashboardController.getKPIs);
router.get('/bookings/chart', dashboardController.getBookingsChart);
router.get('/revenue/chart', dashboardController.getRevenueChart);
router.get('/parking/chart', dashboardController.getParkingChart);
router.get('/traffic/chart', dashboardController.getTrafficChart);

module.exports = router;
