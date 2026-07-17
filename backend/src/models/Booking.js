const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  type: {
    type: String,
    enum: ['Parking', 'City Service', 'Waiting Queue'],
    required: true
  },
  serviceDetails: {
    name: { type: String, required: true },       // Service/slot name
    location: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    scheduledDate: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  queuePosition: { type: Number, default: null },
  adminNote: { type: String, default: '' },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

bookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Optimize query performance with indexes on userId, status, type, and created_at
bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ type: 1 });
bookingSchema.index({ created_at: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
