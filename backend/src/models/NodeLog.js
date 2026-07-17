const mongoose = require('mongoose');

const nodeLogSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now }
});

// Map _id to virtual id for frontend compatibility
nodeLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
nodeLogSchema.set('toJSON', { virtuals: true });
nodeLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('NodeLog', nodeLogSchema);
