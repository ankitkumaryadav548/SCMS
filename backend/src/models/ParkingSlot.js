const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: { type: String, required: true, unique: true },
  zone: { type: String, default: 'A' },          // Zone A, B, C, D
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Occupied'],
    default: 'Available'
  },
  vehicleNumber: { type: String, default: '' },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pricePerHour: { type: Number, default: 20 }   // INR per hour
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

parkingSlotSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
parkingSlotSchema.set('toJSON', { virtuals: true });
parkingSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
