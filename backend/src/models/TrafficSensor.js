const mongoose = require('mongoose');

const trafficSensorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location_lat: { type: Number, required: true },
  location_lng: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
  current_density: { type: Number, default: 0 },
  avg_speed: { type: Number, default: 0.0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' }
});

// Map _id to virtual id for frontend compatibility
trafficSensorSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
trafficSensorSchema.set('toJSON', { virtuals: true });
trafficSensorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrafficSensor', trafficSensorSchema);
