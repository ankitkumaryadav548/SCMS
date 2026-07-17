const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  sensor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TrafficSensor', required: true },
  density: { type: Number, required: true },
  avg_speed: { type: Number, required: true },
  logged_at: { type: Date, default: Date.now }
});

// Map _id to virtual id for frontend compatibility
trafficLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
trafficLogSchema.set('toJSON', { virtuals: true });
trafficLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrafficLog', trafficLogSchema);
