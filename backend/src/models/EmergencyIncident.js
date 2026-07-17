const mongoose = require('mongoose');

const emergencyIncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['Fire', 'Accident', 'Flood', 'Power Outage', 'Medical'], required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  location_lat: { type: Number, required: true },
  location_lng: { type: Number, required: true },
  status: { type: String, enum: ['Reported', 'Dispatched', 'Resolved', 'Closed'], default: 'Reported' },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Map _id to virtual id for frontend compatibility
emergencyIncidentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
emergencyIncidentSchema.set('toJSON', { virtuals: true });
emergencyIncidentSchema.set('toObject', { virtuals: true });

// Optimize query performance with indexes on status, severity, type, and created_at
emergencyIncidentSchema.index({ status: 1 });
emergencyIncidentSchema.index({ severity: 1 });
emergencyIncidentSchema.index({ type: 1 });
emergencyIncidentSchema.index({ created_at: -1 });

module.exports = mongoose.model('EmergencyIncident', emergencyIncidentSchema);
