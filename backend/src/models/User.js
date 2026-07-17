const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Citizen', 'Visitor', 'Operator', 'Admin'], default: 'Citizen' },
  reset_token: { type: String, default: null },
  reset_token_expires: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Map _id to virtual id for frontend compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
