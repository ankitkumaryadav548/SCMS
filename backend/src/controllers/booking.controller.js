const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────
//  QUEUE DATA STRUCTURE (Array-backed FIFO)
//  Time Complexity:
//    enqueue  → O(1)   amortized
//    dequeue  → O(n)   (array shift re-indexes)
//    peek     → O(1)
//    size     → O(1)
//    getAll   → O(n)
//    remove   → O(n)
// ─────────────────────────────────────────────────────────
class BookingQueue {
  constructor() {
    this._data = [];
  }

  enqueue(item) {
    this._data.push(item);
    return this._data.length;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this._data.shift();
  }

  peek() {
    return this._data[0] ?? null;
  }

  size() {
    return this._data.length;
  }

  isEmpty() {
    return this._data.length === 0;
  }

  getAll() {
    return [...this._data];
  }

  remove(bookingId) {
    const before = this._data.length;
    this._data = this._data.filter(
      b => b._id.toString() !== bookingId.toString()
    );
    return before !== this._data.length;
  }
}

// ── Module-level in-memory queue ──────────────────────────
const waitingQueue = new BookingQueue();

// Rebuild queue from DB pending bookings on server start
const rebuildQueue = async () => {
  try {
    const pending = await Booking.find({ status: 'Pending' }).sort({ created_at: 1 });
    pending.forEach(b => {
      const exists = waitingQueue.getAll().find(q => q._id.toString() === b._id.toString());
      if (!exists) waitingQueue.enqueue(b);
    });
    console.log(`📋 Booking queue rebuilt: ${waitingQueue.size()} pending items.`);
  } catch (err) {
    console.error('Queue rebuild failed:', err.message);
  }
};
rebuildQueue();

// Recalculate queue position numbers after any mutation
const refreshQueuePositions = async () => {
  const items = waitingQueue.getAll();
  for (let i = 0; i < items.length; i++) {
    await Booking.findByIdAndUpdate(items[i]._id, { queuePosition: i + 1 });
    items[i].queuePosition = i + 1;
  }
};

// ── Seed parking slots (runs once on first boot) ──────────
const seedParkingSlots = async () => {
  const count = await ParkingSlot.countDocuments();
  if (count > 0) return;
  const zones    = ['A', 'B', 'C', 'D'];
  const locations = ['Connaught Place', 'India Gate', 'Karol Bagh', 'Rajiv Chowk'];
  const slots = [];
  zones.forEach((zone, zi) => {
    for (let i = 1; i <= 5; i++) {
      slots.push({
        slotNumber: `${zone}-${String(i).padStart(2, '0')}`,
        zone,
        location: locations[zi],
        status: 'Available',
        pricePerHour: 20 + zi * 5
      });
    }
  });
  await ParkingSlot.insertMany(slots);
  console.log('🅿️  20 parking slots seeded.');
};
seedParkingSlots();

// ─────────────────────────────────────────────────────────
//  CONTROLLERS
// ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/bookings
 * Create a new booking and add to queue.
 */
exports.createBooking = async (req, res) => {
  try {
    const { type, serviceDetails } = req.body;
    const userId    = req.user.id;
    const userEmail = req.user.email;

    if (!type || !serviceDetails?.name) {
      return res.status(400).json({ success: false, message: 'type and serviceDetails.name are required.' });
    }

    // Fetch full user name from DB
    const userDoc = await User.findById(userId).select('name');
    const userName = userDoc ? userDoc.name : userEmail;

    // For parking: verify slot availability and reserve it
    if (type === 'Parking' && serviceDetails.slotId) {
      const slot = await ParkingSlot.findById(serviceDetails.slotId);
      if (!slot || slot.status !== 'Available') {
        return res.status(400).json({ success: false, message: 'Selected parking slot is not available.' });
      }
      await ParkingSlot.findByIdAndUpdate(serviceDetails.slotId, {
        status: 'Reserved',
        vehicleNumber: serviceDetails.vehicleNumber || '',
        reservedBy: userId
      });
    }

    const booking = await Booking.create({
      userId,
      userName,
      userEmail,
      type,
      serviceDetails: {
        name:          serviceDetails.name,
        location:      serviceDetails.location      || '',
        vehicleNumber: serviceDetails.vehicleNumber || '',
        scheduledDate: serviceDetails.scheduledDate || null,
        notes:         serviceDetails.notes         || ''
      }
    });

    // Enqueue and persist position
    const pos = waitingQueue.enqueue(booking);
    booking.queuePosition = pos;
    await booking.save();

    res.status(201).json({ success: true, message: 'Booking created.', data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/bookings
 * Admin → all bookings; Citizen → own bookings.
 */
exports.getBookings = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { userId: req.user.id };
    const bookings = await Booking.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/bookings/queue
 * Returns the live ordered queue. Admin only.
 */
exports.getQueue = async (req, res) => {
  try {
    const pending = await Booking.find({ status: 'Pending' }).sort({ queuePosition: 1 });
    res.json({ success: true, queueSize: waitingQueue.size(), data: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/v1/bookings/:id/approve
 * Admin approves a pending booking.
 */
exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${booking.status} booking.` });
    }

    booking.status      = 'Approved';
    booking.approvedAt  = new Date();
    booking.adminNote   = req.body.adminNote || '';
    booking.queuePosition = null;
    await booking.save();

    // Mark parking slot as Occupied if applicable
    if (booking.type === 'Parking') {
      await ParkingSlot.findOneAndUpdate(
        { slotNumber: booking.serviceDetails.name },
        { status: 'Occupied' }
      );
    }

    waitingQueue.remove(booking._id);
    await refreshQueuePositions();

    res.json({ success: true, message: 'Booking approved.', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/v1/bookings/:id/reject
 * Admin rejects a pending booking.
 */
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a ${booking.status} booking.` });
    }

    booking.status      = 'Rejected';
    booking.rejectedAt  = new Date();
    booking.adminNote   = req.body.adminNote || '';
    booking.queuePosition = null;
    await booking.save();

    // Free parking slot
    if (booking.type === 'Parking') {
      await ParkingSlot.findOneAndUpdate(
        { slotNumber: booking.serviceDetails.name, status: { $in: ['Reserved', 'Occupied'] } },
        { status: 'Available', vehicleNumber: '', reservedBy: null }
      );
    }

    waitingQueue.remove(booking._id);
    await refreshQueuePositions();

    res.json({ success: true, message: 'Booking rejected.', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/v1/bookings/:id/cancel
 * Citizen cancels their own booking (or Admin cancels any).
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isOwner = booking.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised to cancel this booking.' });
    }
    if (['Cancelled', 'Rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled/rejected.' });
    }

    // Free parking slot
    if (booking.type === 'Parking') {
      await ParkingSlot.findOneAndUpdate(
        { slotNumber: booking.serviceDetails.name },
        { status: 'Available', vehicleNumber: '', reservedBy: null }
      );
    }

    booking.status        = 'Cancelled';
    booking.queuePosition = null;
    await booking.save();

    waitingQueue.remove(booking._id);
    await refreshQueuePositions();

    res.json({ success: true, message: 'Booking cancelled.', data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/bookings/parking-slots
 * Get all parking slots with status.
 */
exports.getParkingSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort({ zone: 1, slotNumber: 1 });
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/bookings/stats
 * Aggregated stats for admin dashboard cards.
 */
exports.getStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,  0,  0,   0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [total, pending, approvedToday, rejected, cancelled, availableSlots] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Approved', approvedAt: { $gte: todayStart, $lte: todayEnd } }),
      Booking.countDocuments({ status: 'Rejected' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      ParkingSlot.countDocuments({ status: 'Available' })
    ]);

    res.json({
      success: true,
      data: { total, pending, approvedToday, rejected, cancelled, availableSlots, queueSize: waitingQueue.size() }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
