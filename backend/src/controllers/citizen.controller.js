const Citizen        = require('../models/Citizen');
const CitizenHistory = require('../models/CitizenHistory');
const User           = require('../models/User');

// ═══════════════════════════════════════════════════════════
//  LINKED LIST DATA STRUCTURE
//  Doubly-Linked List of citizen records (in-memory)
//
//  Each Node holds a citizen document reference and
//  pointers to next/prev nodes in insertion order.
//
//  Time Complexity:
//    insertHead / insertTail → O(1)
//    deleteByObjectId        → O(n)
//    findById                → O(n)
//    toArray                 → O(n)
//    size                    → O(1)
// ═══════════════════════════════════════════════════════════
class ListNode {
  constructor(data) {
    this.data = data;   // citizen document
    this.prev = null;
    this.next = null;
  }
}

class CitizenLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  // O(1) — append to tail
  insertTail(data) {
    const node = new ListNode(data);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev  = this.tail;
      this.tail.next = node;
      this.tail  = node;
    }
    this._size++;
    return node;
  }

  // O(n) — remove node by MongoDB _id string
  deleteById(id) {
    let current = this.head;
    while (current) {
      if (current.data._id.toString() === id.toString()) {
        if (current.prev) current.prev.next = current.next;
        else this.head = current.next;
        if (current.next) current.next.prev = current.prev;
        else this.tail = current.prev;
        this._size--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  // O(n) — update data in a node by id
  updateById(id, newData) {
    let current = this.head;
    while (current) {
      if (current.data._id.toString() === id.toString()) {
        current.data = newData;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  // O(n) — linear search by name / citizenId / email
  search(query) {
    const q = query.toLowerCase();
    const results = [];
    let current = this.head;
    while (current) {
      const c = current.data;
      if (
        c.name.toLowerCase().includes(q) ||
        (c.citizenId && c.citizenId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      ) {
        results.push(c);
      }
      current = current.next;
    }
    return results;
  }

  // O(n)
  toArray() {
    const arr = [];
    let current = this.head;
    while (current) { arr.push(current.data); current = current.next; }
    return arr;
  }

  size() { return this._size; }

  isEmpty() { return this._size === 0; }
}

// ── Module-level in-memory list (rebuilt from DB on start) ──
const citizenList = new CitizenLinkedList();

const rebuildList = async () => {
  try {
    const citizens = await Citizen.find({ status: { $ne: 'Deleted' } }).sort({ created_at: 1 });
    citizens.forEach(c => citizenList.insertTail(c));
    console.log(`👥 Citizen linked-list rebuilt: ${citizenList.size()} nodes.`);
  } catch (err) {
    console.error('Citizen list rebuild failed:', err.message);
  }
};
rebuildList();

// ── Diff helper for audit trail ─────────────────────────────
const buildDiff = (oldDoc, newData) => {
  const diff = {};
  const TRACK = ['name','email','phone','dateOfBirth','gender','aadhaar','address','category','occupation','status','notes'];
  TRACK.forEach(key => {
    const oldVal = JSON.stringify(oldDoc[key]);
    const newVal = JSON.stringify(newData[key] ?? oldDoc[key]);
    if (oldVal !== newVal) diff[key] = { from: oldDoc[key], to: newData[key] };
  });
  return diff;
};

// ── Record history entry ─────────────────────────────────────
const recordHistory = async (citizenDoc, action, userId, userName, changes = {}) => {
  await CitizenHistory.create({
    citizenId:   citizenDoc._id,
    action,
    changedBy:   userName || 'System',
    changedById: userId   || null,
    changes,
    snapshot:    citizenDoc.toObject ? citizenDoc.toObject() : citizenDoc,
  });
};

// ════════════════════════════════════════════════════════════
//  CONTROLLERS
// ════════════════════════════════════════════════════════════

/**
 * POST /api/v1/citizens
 * Create a new citizen record.
 */
exports.createCitizen = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, gender, aadhaar, address,
            category, occupation, status, notes } = req.body;

    if (!name || !email || !phone || !dateOfBirth || !gender) {
      return res.status(400).json({ success: false, message: 'name, email, phone, dateOfBirth and gender are required.' });
    }

    const existing = await Citizen.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const userDoc = await User.findById(req.user.id).select('name');
    const citizen = await Citizen.create({
      name, email, phone, dateOfBirth, gender,
      aadhaar: aadhaar || '',
      address: address || {},
      category: category || 'General',
      occupation: occupation || '',
      status: status || 'Active',
      notes: notes || '',
      registeredBy: req.user.id,
    });

    // Add to in-memory linked list
    citizenList.insertTail(citizen);

    await recordHistory(citizen, 'Created', req.user.id, userDoc?.name || req.user.email, {});

    res.status(201).json({ success: true, message: 'Citizen record created.', data: citizen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/citizens
 * List citizens with search, filter, sort, and pagination.
 * Query params: q, status, category, ward, gender, sort, order, page, limit
 */
exports.getCitizens = async (req, res) => {
  try {
    const { q, status, category, ward, gender, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = req.query;

    // ── Build Mongo filter ──────────────────────────────
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (gender)   filter.gender   = gender;
    if (ward)     filter['address.ward'] = ward;

    // Text search (uses regex on key fields)
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name:       regex },
        { email:      regex },
        { phone:      regex },
        { citizenId:  regex },
        { 'address.street': regex },
      ];
    }

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [citizens, total] = await Promise.all([
      Citizen.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Citizen.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: citizens,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      linkedListSize: citizenList.size(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/citizens/search
 * In-memory linked list search — returns results from the linked list traversal.
 */
exports.searchCitizens = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json({ success: true, data: [] });
    const results = citizenList.search(q.trim());
    res.json({ success: true, data: results, count: results.length, source: 'LinkedList' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/citizens/stats
 * Aggregated stats for dashboard cards.
 */
exports.getStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [total, active, inactive, registeredToday] = await Promise.all([
      Citizen.countDocuments(),
      Citizen.countDocuments({ status: 'Active' }),
      Citizen.countDocuments({ status: 'Inactive' }),
      Citizen.countDocuments({ created_at: { $gte: todayStart } }),
    ]);

    // Category breakdown
    const byCategory = await Citizen.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Ward breakdown
    const byWard = await Citizen.aggregate([
      { $group: { _id: '$address.ward', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    res.json({
      success: true,
      data: {
        total, active, inactive, registeredToday,
        byCategory: byCategory.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
        byWard: byWard.map(w => ({ ward: w._id || 'Unknown', count: w.count })),
        linkedListSize: citizenList.size(),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/citizens/:id
 * Get a single citizen record.
 */
exports.getCitizen = async (req, res) => {
  try {
    const citizen = await Citizen.findById(req.params.id).populate('registeredBy', 'name email');
    if (!citizen) return res.status(404).json({ success: false, message: 'Citizen not found.' });
    res.json({ success: true, data: citizen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/v1/citizens/:id
 * Update a citizen record. Records diff in history.
 */
exports.updateCitizen = async (req, res) => {
  try {
    const citizen = await Citizen.findById(req.params.id);
    if (!citizen) return res.status(404).json({ success: false, message: 'Citizen not found.' });

    const userDoc = await User.findById(req.user.id).select('name');
    const diff    = buildDiff(citizen, req.body);

    const allowedFields = ['name','email','phone','dateOfBirth','gender','aadhaar',
                           'address','category','occupation','status','notes'];
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) citizen[f] = req.body[f];
    });

    await citizen.save();

    // Update linked list in memory
    citizenList.updateById(citizen._id, citizen);

    await recordHistory(citizen, 'Updated', req.user.id, userDoc?.name || req.user.email, diff);

    res.json({ success: true, message: 'Citizen record updated.', data: citizen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/citizens/:id
 * Soft-delete (sets status to Deleted). Hard-delete available via ?hard=true for admins.
 */
exports.deleteCitizen = async (req, res) => {
  try {
    const citizen = await Citizen.findById(req.params.id);
    if (!citizen) return res.status(404).json({ success: false, message: 'Citizen not found.' });

    const userDoc = await User.findById(req.user.id).select('name');
    await recordHistory(citizen, 'Deleted', req.user.id, userDoc?.name || req.user.email, {});

    if (req.query.hard === 'true' && req.user.role === 'Admin') {
      await Citizen.findByIdAndDelete(req.params.id);
      citizenList.deleteById(req.params.id);
      return res.json({ success: true, message: 'Citizen permanently deleted.' });
    }

    // Soft delete
    citizen.status = 'Inactive';
    await citizen.save();
    citizenList.updateById(citizen._id, citizen);

    res.json({ success: true, message: 'Citizen record deactivated.', data: citizen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/citizens/:id/history
 * Get full audit history for a citizen.
 */
exports.getCitizenHistory = async (req, res) => {
  try {
    const citizen = await Citizen.findById(req.params.id);
    if (!citizen) return res.status(404).json({ success: false, message: 'Citizen not found.' });

    const history = await CitizenHistory
      .find({ citizenId: req.params.id })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({ success: true, data: history, citizen: { name: citizen.name, citizenId: citizen.citizenId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/citizens/seed
 * Seed 20 demo citizen records (admin only, dev only).
 */
exports.seedDemoCitizens = async (req, res) => {
  try {
    const count = await Citizen.countDocuments();
    if (count >= 10) return res.json({ success: true, message: 'Citizens already seeded.' });

    const wards      = ['Ward A','Ward B','Ward C','Ward D','Ward E','Ward F','Ward G','Ward H'];
    const categories = ['General','OBC','SC','ST','EWS'];
    const genders    = ['Male','Female','Other'];
    const statuses   = ['Active','Active','Active','Active','Inactive'];
    const occupations= ['Farmer','Teacher','Engineer','Doctor','Business Owner','Student','Clerk','Retired'];

    const demoData = [
      { name: 'Arjun Sharma',   email: 'arjun.sharma@demo.in',   phone: '9811001001' },
      { name: 'Priya Patel',    email: 'priya.patel@demo.in',    phone: '9811001002' },
      { name: 'Rohit Kumar',    email: 'rohit.kumar@demo.in',    phone: '9811001003' },
      { name: 'Neha Singh',     email: 'neha.singh@demo.in',     phone: '9811001004' },
      { name: 'Amit Verma',     email: 'amit.verma@demo.in',     phone: '9811001005' },
      { name: 'Sunita Devi',    email: 'sunita.devi@demo.in',    phone: '9811001006' },
      { name: 'Vikram Yadav',   email: 'vikram.yadav@demo.in',   phone: '9811001007' },
      { name: 'Anjali Mishra',  email: 'anjali.mishra@demo.in',  phone: '9811001008' },
      { name: 'Sanjay Gupta',   email: 'sanjay.gupta@demo.in',   phone: '9811001009' },
      { name: 'Meera Agarwal',  email: 'meera.agarwal@demo.in',  phone: '9811001010' },
      { name: 'Deepak Joshi',   email: 'deepak.joshi@demo.in',   phone: '9811001011' },
      { name: 'Kavya Nair',     email: 'kavya.nair@demo.in',     phone: '9811001012' },
      { name: 'Suresh Iyer',    email: 'suresh.iyer@demo.in',    phone: '9811001013' },
      { name: 'Lakshmi Reddy',  email: 'lakshmi.reddy@demo.in',  phone: '9811001014' },
      { name: 'Manish Tiwari',  email: 'manish.tiwari@demo.in',  phone: '9811001015' },
      { name: 'Ritu Kapoor',    email: 'ritu.kapoor@demo.in',    phone: '9811001016' },
      { name: 'Anil Chauhan',   email: 'anil.chauhan@demo.in',   phone: '9811001017' },
      { name: 'Pooja Rao',      email: 'pooja.rao@demo.in',      phone: '9811001018' },
      { name: 'Raj Malhotra',   email: 'raj.malhotra@demo.in',   phone: '9811001019' },
      { name: 'Divya Pillai',   email: 'divya.pillai@demo.in',   phone: '9811001020' },
    ];

    const rand = arr => arr[Math.floor(Math.random() * arr.length)];
    const randDate = () => new Date(
      1970 + Math.floor(Math.random() * 40),
      Math.floor(Math.random() * 12),
      1 + Math.floor(Math.random() * 28)
    );

    const docs = demoData.map((d, i) => ({
      ...d,
      dateOfBirth: randDate(),
      gender:      i % 3 === 1 ? 'Female' : 'Male',
      category:    rand(categories),
      status:      rand(statuses),
      occupation:  rand(occupations),
      address: {
        street:  `${i + 1} Nehru Nagar`,
        ward:    rand(wards),
        city:    'New Delhi',
        pincode: `110${String(10 + i).padStart(3, '0')}`,
      },
    }));

    const created = await Citizen.insertMany(docs);
    created.forEach(c => citizenList.insertTail(c));

    res.json({ success: true, message: `${created.length} demo citizens seeded.`, count: created.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
