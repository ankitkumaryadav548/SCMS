const mongoose = require('mongoose');

const citizenHistorySchema = new mongoose.Schema({
  citizenId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },
  action:     { type: String, enum: ['Created', 'Updated', 'Deleted', 'Restored'], required: true },
  changedBy:  { type: String, required: true },   // user name or 'System'
  changedById:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  changes:    { type: mongoose.Schema.Types.Mixed, default: {} }, // diff of changed fields
  snapshot:   { type: mongoose.Schema.Types.Mixed, default: {} }, // full citizen snapshot
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

citizenHistorySchema.virtual('id').get(function () { return this._id.toHexString(); });
citizenHistorySchema.set('toJSON',   { virtuals: true });
citizenHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CitizenHistory', citizenHistorySchema);
