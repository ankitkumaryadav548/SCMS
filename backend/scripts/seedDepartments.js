/**
 * Department Seed Script — Direct MongoDB injection
 * Run: node scripts/seedDepartments.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_city';

// Inline Department Schema
const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  type:        { type: String, enum: ['Department', 'SubDepartment', 'Employee'], required: true },
  code:        { type: String, default: '' },
  parentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  description: { type: String, default: '' },
  head:        { type: String, default: '' },
  budget:      { type: Number, default: 0 },
  location:    { type: String, default: '' },
  contact:     { type: String, default: '' },
  email:       { type: String, default: '' },
  established: { type: Number, default: null },
  designation:  { type: String, default: '' },
  employeeId:   { type: String, default: '' },
  phone:        { type: String, default: '' },
  employeeEmail:{ type: String, default: '' },
  joinDate:     { type: Date,   default: null },
  salary:       { type: Number, default: 0 },
  status:       { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  depth:       { type: Number, default: 0 },
  order:       { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Department = mongoose.model('Department', departmentSchema);

const deptData = [
  { name: 'Public Works Dept',        code: 'PWD',  description: 'Roads, bridges, and infrastructure.',    head: 'Rajiv Sharma',   budget: 50000000, location: 'Sector 1, Delhi',   email: 'pwd@delhi.gov.in',   established: 1952 },
  { name: 'Health Services',          code: 'HLTH', description: 'Public health and hospital management.', head: 'Dr. Priya Nair',  budget: 75000000, location: 'Sector 3, Delhi',   email: 'health@delhi.gov.in', established: 1960 },
  { name: 'Education Dept',           code: 'EDU',  description: 'Schools, colleges, and skill dev.',      head: 'Anita Gupta',    budget: 60000000, location: 'Sector 5, Delhi',   email: 'edu@delhi.gov.in',    established: 1947 },
  { name: 'Municipal Services',       code: 'MCD',  description: 'Water, sanitation, and waste mgmt.',     head: 'Suresh Kumar',   budget: 40000000, location: 'Sector 7, Delhi',   email: 'mcd@delhi.gov.in',    established: 1958 },
  { name: 'Finance & Revenue',        code: 'FIN',  description: 'Tax collection and budget allocation.',  head: 'Amit Verma',     budget: 20000000, location: 'Secretariat, Delhi', email: 'finance@delhi.gov.in',established: 1950 },
];

const subDeptData = [
  { parentIdx: 0, subs: ['Road Construction', 'Bridge Maintenance', 'Drainage Systems'] },
  { parentIdx: 1, subs: ['Primary Healthcare', 'Hospital Administration', 'Medical Stores'] },
  { parentIdx: 2, subs: ['Primary Schools', 'Secondary Education', 'Technical Training'] },
  { parentIdx: 3, subs: ['Water Supply', 'Solid Waste', 'Sewerage Management'] },
  { parentIdx: 4, subs: ['Tax Collection', 'Budget Planning', 'Accounts & Audit'] },
];

const firstNames = ['Arjun','Pooja','Rahul','Neha','Vijay','Rekha','Anil','Kavya','Sanjay','Divya'];
const lastNames  = ['Sharma','Patel','Kumar','Singh','Verma','Gupta','Mishra','Joshi','Rao','Nair'];
const designations = ['Junior Engineer','Senior Clerk','Accountant','Data Analyst','Field Officer','Manager','Inspector','Supervisor'];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Department.countDocuments();
    if (existing >= 5) {
      console.log(`⚠️  ${existing} department nodes already exist. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }

    await Department.deleteMany({});
    
    // Seed Departments
    const createdDepts = [];
    for (let i = 0; i < deptData.length; i++) {
      const d = await Department.create({ ...deptData[i], type: 'Department', depth: 0, order: i });
      createdDepts.push(d);
      console.log(`  🏢 Seeded Dept: ${d.name}`);
    }

    // Seed Sub-departments
    const createdSubs = [];
    for (const sd of subDeptData) {
      for (let j = 0; j < sd.subs.length; j++) {
        const sub = await Department.create({
          name: sd.subs[j], type: 'SubDepartment',
          parentId: createdDepts[sd.parentIdx]._id,
          depth: 1, order: j,
          description: `${sd.subs[j]} division of ${createdDepts[sd.parentIdx].name}`,
          head: ['Ravi Malhotra', 'Sunita Devi', 'Kiran Yadav', 'Meena Singh', 'Raj Kapoor'][j % 5],
          location: createdDepts[sd.parentIdx].location,
        });
        createdSubs.push({ sub, deptIdx: sd.parentIdx });
        console.log(`    🌿 Seeded SubDept: ${sub.name} (Parent: ${createdDepts[sd.parentIdx].name})`);
      }
    }

    // Seed Employees (2 per sub-department)
    let empCount = 0;
    for (const { sub } of createdSubs) {
      for (let k = 0; k < 2; k++) {
        const fname = firstNames[(empCount + k) % firstNames.length];
        const lname = lastNames[(empCount + k + 3) % lastNames.length];
        const emp = await Department.create({
          name: `${fname} ${lname}`,
          type: 'Employee',
          parentId: sub._id,
          depth: 2, order: k,
          designation: designations[(empCount + k) % designations.length],
          employeeId: `EMP-${String(empCount + k + 1).padStart(4,'0')}`,
          employeeEmail: `${fname.toLowerCase()}.${lname.toLowerCase()}@delhi.gov.in`,
          phone: `98110${String(10000 + empCount + k).slice(1)}`,
          joinDate: new Date(2015 + ((empCount + k) % 8), (empCount * 2) % 12, 1),
          salary: 35000 + (empCount + k) * 2000,
          status: k === 0 ? 'Active' : ['Active','Active','On Leave'][empCount % 3],
        });
        console.log(`      👤 Seeded Employee: ${emp.name} (${emp.designation})`);
        empCount++;
      }
    }

    console.log(`🎉 Seeded all department directory structures successfully! Total nodes: ${15 + 30 + 5}`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

seed();
