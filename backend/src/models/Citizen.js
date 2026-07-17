const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
  // Identity
  citizenId:   { type: String, unique: true },   // auto-generated e.g. CIT-00001
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  dateOfBirth: { type: Date,   required: true },
  gender:      { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  aadhaar:     { type: String, default: '' },         // masked Aadhaar
  photo:       { type: String, default: '' },         // URL / base64

  // Address
  address: {
    street:  { type: String, default: '' },
    ward:    { type: String, default: '' },           // Ward A–H
    city:    { type: String, default: 'New Delhi' },
    pincode: { type: String, default: '' },
  },

  // Classification
  category:   { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'], default: 'General' },
  occupation: { type: String, default: '' },
  status:     { type: String, enum: ['Active', 'Inactive', 'Deceased', 'Migrated'], default: 'Active' },

  // System
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes:        { type: String, default: '' },

  // Linked-list pointer (stored for reference; in-memory list is rebuilt at runtime)
  nextId: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

citizenSchema.virtual('id').get(function () { return this._id.toHexString(); });
citizenSchema.set('toJSON',   { virtuals: true });
citizenSchema.set('toObject', { virtuals: true });

// Optimize query performance with indexes on search, sort and filter fields
citizenSchema.index({ citizenId: 1 });
citizenSchema.index({ name: 1 });
citizenSchema.index({ status: 1 });
citizenSchema.index({ category: 1 });
citizenSchema.index({ 'address.ward': 1 });
citizenSchema.index({ gender: 1 });
citizenSchema.index({ registeredBy: 1 });

// Auto-generate citizenId before save
citizenSchema.pre('save', async function (next) {
  if (this.citizenId) return next();
  const count = await mongoose.model('Citizen').countDocuments();
  this.citizenId = `CIT-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Citizen', citizenSchema);
