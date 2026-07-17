/**
 * Citizen Seed Script — Direct MongoDB injection
 * Run: node scripts/seedCitizens.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_city';

// ── Citizen Schema (inline so we don't need full module path) ──
const citizenSchema = new mongoose.Schema({
  citizenId:   { type: String, unique: true },
  name:        String,
  email:       String,
  phone:       String,
  dateOfBirth: Date,
  gender:      String,
  aadhaar:     String,
  address: {
    street:  String,
    ward:    String,
    city:    String,
    pincode: String,
  },
  category:    String,
  occupation:  String,
  status:      { type: String, default: 'Active' },
  notes:       String,
  nextId:      mongoose.Schema.Types.ObjectId,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Citizen = mongoose.model('Citizen', citizenSchema);

const citizens = [
  {
    citizenId: 'CIT-00001', name: 'Arjun Sharma',
    email: 'arjun.sharma@newdelhi.gov.in', phone: '9811001001',
    dateOfBirth: new Date('1985-04-12'), gender: 'Male',
    address: { street: '14 Connaught Place', ward: 'Ward A', city: 'New Delhi', pincode: '110001' },
    category: 'General', occupation: 'Software Engineer', status: 'Active',
    notes: 'Senior citizen of Ward A. Has availed water scheme benefits.',
  },
  {
    citizenId: 'CIT-00002', name: 'Priya Patel',
    email: 'priya.patel@newdelhi.gov.in', phone: '9811001002',
    dateOfBirth: new Date('1992-07-23'), gender: 'Female',
    address: { street: '7 Rajouri Garden', ward: 'Ward B', city: 'New Delhi', pincode: '110027' },
    category: 'OBC', occupation: 'Teacher', status: 'Active',
    notes: 'School teacher in Ward B. Registered under OBC scheme.',
  },
  {
    citizenId: 'CIT-00003', name: 'Rohit Kumar',
    email: 'rohit.kumar@newdelhi.gov.in', phone: '9811001003',
    dateOfBirth: new Date('1978-01-15'), gender: 'Male',
    address: { street: '3 Lajpat Nagar', ward: 'Ward C', city: 'New Delhi', pincode: '110024' },
    category: 'SC', occupation: 'Government Clerk', status: 'Active',
    notes: 'Eligible for SC housing scheme. Applied in 2024.',
  },
  {
    citizenId: 'CIT-00004', name: 'Neha Singh',
    email: 'neha.singh@newdelhi.gov.in', phone: '9811001004',
    dateOfBirth: new Date('1995-11-30'), gender: 'Female',
    address: { street: '22 Karol Bagh', ward: 'Ward D', city: 'New Delhi', pincode: '110005' },
    category: 'General', occupation: 'Doctor', status: 'Active',
    notes: 'MBBS, working at AIIMS outreach. Ward D health volunteer.',
  },
  {
    citizenId: 'CIT-00005', name: 'Amit Verma',
    email: 'amit.verma@newdelhi.gov.in', phone: '9811001005',
    dateOfBirth: new Date('1970-06-09'), gender: 'Male',
    address: { street: '9 Pitampura', ward: 'Ward E', city: 'New Delhi', pincode: '110034' },
    category: 'EWS', occupation: 'Farmer', status: 'Active',
    notes: 'Urban farmer. Participating in rooftop farming initiative.',
  },
  {
    citizenId: 'CIT-00006', name: 'Sunita Devi',
    email: 'sunita.devi@newdelhi.gov.in', phone: '9811001006',
    dateOfBirth: new Date('1960-03-17'), gender: 'Female',
    address: { street: '5 Dwarka Sector 6', ward: 'Ward F', city: 'New Delhi', pincode: '110075' },
    category: 'ST', occupation: 'Homemaker', status: 'Inactive',
    notes: 'Senior citizen. Entitled to pension scheme.',
  },
  {
    citizenId: 'CIT-00007', name: 'Vikram Yadav',
    email: 'vikram.yadav@newdelhi.gov.in', phone: '9811001007',
    dateOfBirth: new Date('1988-09-20'), gender: 'Male',
    address: { street: '18 Saket', ward: 'Ward G', city: 'New Delhi', pincode: '110017' },
    category: 'OBC', occupation: 'Business Owner', status: 'Active',
    notes: 'Local market trader. Pays commercial tax.',
  },
  {
    citizenId: 'CIT-00008', name: 'Anjali Mishra',
    email: 'anjali.mishra@newdelhi.gov.in', phone: '9811001008',
    dateOfBirth: new Date('1999-02-28'), gender: 'Female',
    address: { street: '41 Vasant Kunj', ward: 'Ward H', city: 'New Delhi', pincode: '110070' },
    category: 'General', occupation: 'Student', status: 'Active',
    notes: 'University student. Registered under youth scheme.',
  },
  {
    citizenId: 'CIT-00009', name: 'Sanjay Gupta',
    email: 'sanjay.gupta@newdelhi.gov.in', phone: '9811001009',
    dateOfBirth: new Date('1975-12-05'), gender: 'Male',
    address: { street: '11 Rohini Sector 3', ward: 'Ward A', city: 'New Delhi', pincode: '110085' },
    category: 'General', occupation: 'Retired Bank Manager', status: 'Active',
    notes: 'Ex-SBI manager. Active in Ward A RWA.',
  },
  {
    citizenId: 'CIT-00010', name: 'Meera Agarwal',
    email: 'meera.agarwal@newdelhi.gov.in', phone: '9811001010',
    dateOfBirth: new Date('1983-08-14'), gender: 'Female',
    address: { street: '6 Greater Kailash-I', ward: 'Ward B', city: 'New Delhi', pincode: '110048' },
    category: 'General', occupation: 'Architect', status: 'Active',
    notes: 'Urban planning consultant. Involved in smart city project.',
  },
  {
    citizenId: 'CIT-00011', name: 'Deepak Joshi',
    email: 'deepak.joshi@newdelhi.gov.in', phone: '9811001011',
    dateOfBirth: new Date('1968-05-22'), gender: 'Male',
    address: { street: '33 Patel Nagar', ward: 'Ward C', city: 'New Delhi', pincode: '110008' },
    category: 'OBC', occupation: 'Mechanic', status: 'Active',
    notes: 'Skilled auto-mechanic. Enrolled in PMKVY skill program.',
  },
  {
    citizenId: 'CIT-00012', name: 'Kavya Nair',
    email: 'kavya.nair@newdelhi.gov.in', phone: '9811001012',
    dateOfBirth: new Date('2001-10-01'), gender: 'Female',
    address: { street: '2 South Extension', ward: 'Ward D', city: 'New Delhi', pincode: '110049' },
    category: 'General', occupation: 'Graphic Designer', status: 'Active',
    notes: 'Freelance designer. Migrated from Kerala.',
  },
  {
    citizenId: 'CIT-00013', name: 'Suresh Iyer',
    email: 'suresh.iyer@newdelhi.gov.in', phone: '9811001013',
    dateOfBirth: new Date('1955-07-10'), gender: 'Male',
    address: { street: '88 R.K. Puram', ward: 'Ward E', city: 'New Delhi', pincode: '110022' },
    category: 'General', occupation: 'Retired IAS Officer', status: 'Active',
    notes: 'Former joint secretary. Mentors youth in governance.',
  },
  {
    citizenId: 'CIT-00014', name: 'Lakshmi Reddy',
    email: 'lakshmi.reddy@newdelhi.gov.in', phone: '9811001014',
    dateOfBirth: new Date('1990-03-25'), gender: 'Female',
    address: { street: '15 Hauz Khas', ward: 'Ward F', city: 'New Delhi', pincode: '110016' },
    category: 'SC', occupation: 'Nurse', status: 'Active',
    notes: 'Works at LNJP Hospital. Single parent household.',
  },
  {
    citizenId: 'CIT-00015', name: 'Manish Tiwari',
    email: 'manish.tiwari@newdelhi.gov.in', phone: '9811001015',
    dateOfBirth: new Date('1982-12-18'), gender: 'Male',
    address: { street: '77 Janakpuri', ward: 'Ward G', city: 'New Delhi', pincode: '110058' },
    category: 'EWS', occupation: 'Daily Wage Worker', status: 'Inactive',
    notes: 'Seasonal migrant worker. Currently inactive in record.',
  },
  {
    citizenId: 'CIT-00016', name: 'Ritu Kapoor',
    email: 'ritu.kapoor@newdelhi.gov.in', phone: '9811001016',
    dateOfBirth: new Date('1977-09-03'), gender: 'Female',
    address: { street: '4 Safdarjung Enclave', ward: 'Ward H', city: 'New Delhi', pincode: '110029' },
    category: 'General', occupation: 'Journalist', status: 'Active',
    notes: 'Senior editor. Covers civic affairs and governance.',
  },
  {
    citizenId: 'CIT-00017', name: 'Anil Chauhan',
    email: 'anil.chauhan@newdelhi.gov.in', phone: '9811001017',
    dateOfBirth: new Date('1972-04-27'), gender: 'Male',
    address: { street: '19 Naraina', ward: 'Ward A', city: 'New Delhi', pincode: '110028' },
    category: 'ST', occupation: 'Police Constable', status: 'Active',
    notes: 'Delhi Police. Community liaison officer for Ward A.',
  },
  {
    citizenId: 'CIT-00018', name: 'Pooja Rao',
    email: 'pooja.rao@newdelhi.gov.in', phone: '9811001018',
    dateOfBirth: new Date('1994-06-15'), gender: 'Female',
    address: { street: '50 Mayur Vihar Phase-1', ward: 'Ward B', city: 'New Delhi', pincode: '110091' },
    category: 'OBC', occupation: 'Data Analyst', status: 'Active',
    notes: 'Works in tech sector. Part of digital literacy NGO.',
  },
  {
    citizenId: 'CIT-00019', name: 'Raj Malhotra',
    email: 'raj.malhotra@newdelhi.gov.in', phone: '9811001019',
    dateOfBirth: new Date('1966-11-11'), gender: 'Male',
    address: { street: '8 Tilak Nagar', ward: 'Ward C', city: 'New Delhi', pincode: '110018' },
    category: 'General', occupation: 'CA Practitioner', status: 'Active',
    notes: 'Chartered Accountant. Ward C tax consultant.',
  },
  {
    citizenId: 'CIT-00020', name: 'Divya Pillai',
    email: 'divya.pillai@newdelhi.gov.in', phone: '9811001020',
    dateOfBirth: new Date('2000-08-08'), gender: 'Female',
    address: { street: '25 Munirka', ward: 'Ward D', city: 'New Delhi', pincode: '110067' },
    category: 'SC', occupation: 'Student – IIT Delhi', status: 'Active',
    notes: 'B.Tech student. Scholarship recipient under SC quota.',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Citizen.countDocuments();
    if (existing >= 15) {
      console.log(`⚠️  ${existing} citizen records already exist. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }

    // Delete any partial existing records
    await Citizen.deleteMany({});
    const result = await Citizen.insertMany(citizens);
    console.log(`🎉 Seeded ${result.length} citizen records successfully!`);
    result.forEach(c => console.log(`  ✔ ${c.citizenId} — ${c.name} (${c.address.ward})`));
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  }
}

seed();
