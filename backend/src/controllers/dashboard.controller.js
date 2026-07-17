// src/controllers/dashboard.controller.js

/**
 * Dashboard Controller – provides aggregated metrics for the admin UI.
 * Endpoints:
 *   GET /api/v1/dashboard/kpis          – KPI snapshot (bookings, users, revenue, parking, traffic)
 *   GET /api/v1/dashboard/bookings/chart – booking status pie & daily bar data
 *   GET /api/v1/dashboard/revenue/chart – monthly revenue line data
 *   GET /api/v1/dashboard/parking/chart – parking occupancy pie data
 *   GET /api/v1/dashboard/traffic/chart – traffic incidents area data
 */

const Booking = require('../models/Booking');
const Citizen = require('../models/Citizen');
const ParkingSlot = require('../models/ParkingSlot');
const EmergencyIncident = require('../models/EmergencyIncident');

// Helper to safely format numbers
const fmt = n => (n !== undefined && n !== null ? n : 0);

// GET /api/v1/dashboard/kpis – overall snapshot for the KPI cards
exports.getKPIs = async (req, res) => {
  try {
    const [bookingAgg, citizenCount, parkingAgg, incidentCount, revenueAgg] = await Promise.all([
      // Booking aggregation (total + status counts)
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
          }
        }
      ]),
      // Citizens count (users of the system)
      Citizen.countDocuments(),
      // Parking occupancy aggregation
      ParkingSlot.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } }
          }
        }
      ]),
      // Emergency incidents count (used for traffic KPI)
      EmergencyIncident.countDocuments(),
      // Revenue – sum of fee for approved bookings (assumes `fee` field exists)
      Booking.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, revenue: { $sum: '$fee' } } }
      ])
    ]);

    const booking = bookingAgg[0] || { total: 0, pending: 0, approved: 0, cancelled: 0 };
    const parking = parkingAgg[0] || { total: 0, occupied: 0 };
    const revenue = revenueAgg[0] ? revenueAgg[0].revenue : 0;

    res.json({
      bookings: fmt(booking.total),
      pendingBookings: fmt(booking.pending),
      approvedBookings: fmt(booking.approved),
      cancelledBookings: fmt(booking.cancelled),
      users: fmt(citizenCount),
      parking: {
        total: fmt(parking.total),
        occupied: fmt(parking.occupied),
        available: fmt(parking.total - parking.occupied)
      },
      trafficIncidents: fmt(incidentCount),
      revenue: fmt(revenue)
    });
  } catch (err) {
    console.error('Dashboard KPI error:', err);
    res.status(500).json({ message: 'Failed to load dashboard KPI data' });
  }
};

// GET /api/v1/dashboard/bookings/chart – pie (status) + bar (daily count)
exports.getBookingsChart = async (req, res) => {
  try {
    const [statusAgg, dailyAgg] = await Promise.all([
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    res.json({
      pie: statusAgg.map(s => ({ label: s._id, value: s.count })),
      bar: dailyAgg.map(d => ({ date: d._id, count: d.count }))
    });
  } catch (err) {
    console.error('Bookings chart error:', err);
    res.status(500).json({ message: 'Failed to load bookings chart data' });
  }
};

// GET /api/v1/dashboard/revenue/chart – monthly revenue line (last 12 months)
exports.getRevenueChart = async (req, res) => {
  try {
    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'Approved', createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, amount: { $sum: '$fee' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ line: revenueAgg.map(r => ({ month: r._id, amount: r.amount })) });
  } catch (err) {
    console.error('Revenue chart error:', err);
    res.status(500).json({ message: 'Failed to load revenue chart data' });
  }
};

// GET /api/v1/dashboard/parking/chart – occupancy distribution pie chart
exports.getParkingChart = async (req, res) => {
  try {
    const agg = await ParkingSlot.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ pie: agg.map(a => ({ label: a._id, value: a.count })) });
  } catch (err) {
    console.error('Parking chart error:', err);
    res.status(500).json({ message: 'Failed to load parking chart data' });
  }
};

// GET /api/v1/dashboard/traffic/chart – incidents over last 30 days (area chart)
exports.getTrafficChart = async (req, res) => {
  try {
    const agg = await EmergencyIncident.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ area: agg.map(a => ({ date: a._id, count: a.count })) });
  } catch (err) {
    console.error('Traffic chart error:', err);
    res.status(500).json({ message: 'Failed to load traffic chart data' });
  }
};
