const mongoose = require('mongoose');

const utilityGridSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Electricity', 'Water', 'Gas'], required: true },
  capacity: { type: Number, required: true },
  current_load: { type: Number, default: 0.0 },
  status: { type: String, enum: ['Normal', 'Overloaded', 'Outage', 'Maintenance'], default: 'Normal' },
  location_lat: { type: Number, required: true },
  location_lng: { type: Number, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' }
});

// Map _id to virtual id for frontend compatibility
utilityGridSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
utilityGridSchema.set('toJSON', { virtuals: true });
utilityGridSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UtilityGrid', utilityGridSchema);
