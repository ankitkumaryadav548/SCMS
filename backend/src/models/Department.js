const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  type:        { type: String, enum: ['Department', 'SubDepartment', 'Employee'], required: true },
  code:        { type: String, default: '' },          // e.g. PWD, MCD, NDMC
  parentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },

  // Department / SubDepartment fields
  description: { type: String, default: '' },
  head:        { type: String, default: '' },          // Head name
  budget:      { type: Number, default: 0 },
  location:    { type: String, default: '' },
  contact:     { type: String, default: '' },
  email:       { type: String, default: '' },
  established: { type: Number, default: null },

  // Employee-specific fields
  designation:  { type: String, default: '' },
  employeeId:   { type: String, default: '' },
  phone:        { type: String, default: '' },
  employeeEmail:{ type: String, default: '' },
  joinDate:     { type: Date,   default: null },
  salary:       { type: Number, default: 0 },
  status:       { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },

  // Tree metadata
  depth:       { type: Number, default: 0 },           // 0=Dept, 1=SubDept, 2=Employee
  order:       { type: Number, default: 0 },           // sibling sort order
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

departmentSchema.virtual('id').get(function () { return this._id.toHexString(); });
departmentSchema.set('toJSON',   { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Department', departmentSchema);
