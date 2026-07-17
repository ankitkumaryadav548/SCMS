const Department = require('../models/Department');

// ═══════════════════════════════════════════════════════════
//  TREE DATA STRUCTURE
//  N-ary tree built from flat MongoDB array.
//
//  Time Complexity:
//    build      → O(n)   — single pass linking children
//    insertNode → O(1)   — append child to parent
//    DFS search → O(n)   — visits every node once
//    BFS level  → O(n)   — queue-based traversal
//    getSubtree → O(k)   — k = size of subtree
// ═══════════════════════════════════════════════════════════
class TreeNode {
  constructor(data) {
    this.data     = data;     // Department document
    this.children = [];       // TreeNode[]
    this.parent   = null;
  }
}

class DepartmentTree {
  constructor() {
    this.roots = [];           // top-level Department nodes
    this._nodeMap = new Map(); // id → TreeNode  (O(1) lookup)
  }

  // Build tree from flat array of department docs — O(n)
  build(docs) {
    this.roots = [];
    this._nodeMap.clear();

    // First pass: create all nodes
    docs.forEach(doc => {
      const node = new TreeNode(doc);
      this._nodeMap.set(doc._id.toString(), node);
    });

    // Second pass: link parent → child
    docs.forEach(doc => {
      const node = this._nodeMap.get(doc._id.toString());
      if (doc.parentId) {
        const parent = this._nodeMap.get(doc.parentId.toString());
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        } else {
          this.roots.push(node); // orphan → treat as root
        }
      } else {
        this.roots.push(node);
      }
    });

    // Sort children by order field
    this._nodeMap.forEach(node => {
      node.children.sort((a, b) => a.data.order - b.data.order);
    });

    return this;
  }

  // O(1) — insert a new node doc into the in-memory tree
  insertNode(doc) {
    const node = new TreeNode(doc);
    this._nodeMap.set(doc._id.toString(), node);
    if (doc.parentId) {
      const parent = this._nodeMap.get(doc.parentId.toString());
      if (parent) { parent.children.push(node); node.parent = parent; }
      else { this.roots.push(node); }
    } else {
      this.roots.push(node);
    }
    return node;
  }

  // O(n) — remove node and its entire subtree from memory
  deleteNode(id) {
    const node = this._nodeMap.get(id.toString());
    if (!node) return false;
    // Remove from parent's children
    if (node.parent) {
      node.parent.children = node.parent.children.filter(c => c !== node);
    } else {
      this.roots = this.roots.filter(r => r !== node);
    }
    // Remove subtree from map
    this._removeSubtree(node);
    return true;
  }

  _removeSubtree(node) {
    this._nodeMap.delete(node.data._id.toString());
    node.children.forEach(c => this._removeSubtree(c));
  }

  // DFS search — O(n), returns matching nodes
  searchDFS(query) {
    const q = query.toLowerCase();
    const results = [];
    const visit = node => {
      const d = node.data;
      if (
        d.name.toLowerCase().includes(q) ||
        (d.code         && d.code.toLowerCase().includes(q)) ||
        (d.head         && d.head.toLowerCase().includes(q)) ||
        (d.designation  && d.designation.toLowerCase().includes(q)) ||
        (d.employeeId   && d.employeeId.toLowerCase().includes(q)) ||
        (d.description  && d.description.toLowerCase().includes(q))
      ) {
        results.push({ node: d, path: this._getPath(node) });
      }
      node.children.forEach(visit);
    };
    this.roots.forEach(visit);
    return results;
  }

  // BFS level-order traversal — O(n)
  bfs() {
    const levels = [];
    const queue = this.roots.map(r => ({ node: r, level: 0 }));
    while (queue.length) {
      const { node, level } = queue.shift();
      if (!levels[level]) levels[level] = [];
      levels[level].push(node.data);
      node.children.forEach(c => queue.push({ node: c, level: level + 1 }));
    }
    return levels;
  }

  // Returns breadcrumb path for a node
  _getPath(node) {
    const path = [];
    let cur = node;
    while (cur) { path.unshift(cur.data.name); cur = cur.parent; }
    return path.join(' › ');
  }

  // Convert to nested plain object (for JSON response)
  toJSON() {
    const toObj = node => ({
      ...node.data.toObject ? node.data.toObject() : node.data,
      children: node.children.map(toObj)
    });
    return this.roots.map(toObj);
  }

  size() { return this._nodeMap.size; }
}

// ── Module-level tree (rebuilt on server start) ─────────────
const tree = new DepartmentTree();

const rebuildTree = async () => {
  try {
    const docs = await Department.find().sort({ depth: 1, order: 1 });
    tree.build(docs);
    console.log(`🌳 Department tree rebuilt: ${tree.size()} nodes.`);
  } catch (err) {
    console.error('Tree rebuild failed:', err.message);
  }
};

// Start building
rebuildTree();

// ══════════════════════════════════════════════════════
//  CONTROLLERS
// ══════════════════════════════════════════════════════

/**
 * GET /api/v1/departments/tree
 * Returns the full nested tree as JSON.
 */
exports.getTree = async (req, res) => {
  try {
    res.json({
      success: true,
      data: tree.toJSON(),
      nodeCount: tree.size()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/departments/search?q=
 * DFS search across the in-memory tree.
 */
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json({ success: true, data: [] });
    const results = tree.searchDFS(q.trim());
    res.json({ success: true, data: results, count: results.length, source: 'Tree-DFS' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/departments/bfs
 * BFS level-order traversal.
 */
exports.getBFS = async (req, res) => {
  try {
    const levels = tree.bfs();
    res.json({ success: true, data: levels, levels: levels.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/departments/stats
 * Aggregated statistics.
 */
exports.getStats = async (req, res) => {
  try {
    const [depts, subDepts, employees, active] = await Promise.all([
      Department.countDocuments({ type: 'Department' }),
      Department.countDocuments({ type: 'SubDepartment' }),
      Department.countDocuments({ type: 'Employee' }),
      Department.countDocuments({ type: 'Employee', status: 'Active' }),
    ]);
    res.json({
      success: true,
      data: { departments: depts, subDepartments: subDepts, employees, activeEmployees: active, totalNodes: tree.size() }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/departments
 * Flat list (with optional filter by type / parentId).
 */
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)     filter.type     = req.query.type;
    if (req.query.parentId) filter.parentId = req.query.parentId;
    const docs = await Department.find(filter).sort({ depth: 1, order: 1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/departments/:id
 */
exports.getOne = async (req, res) => {
  try {
    const doc = await Department.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Node not found.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/departments
 * Create a department, sub-department or employee node.
 */
exports.create = async (req, res) => {
  try {
    const { name, type, parentId, ...rest } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'name and type are required.' });
    }

    // Determine depth from type
    const depthMap = { Department: 0, SubDepartment: 1, Employee: 2 };
    const depth = depthMap[type] ?? 0;

    // Validate parentId rules
    if (type === 'SubDepartment' && !parentId) {
      return res.status(400).json({ success: false, message: 'SubDepartment requires a parent Department.' });
    }
    if (type === 'Employee' && !parentId) {
      return res.status(400).json({ success: false, message: 'Employee requires a parent SubDepartment.' });
    }

    // Auto-order: count siblings
    const siblingCount = await Department.countDocuments({ parentId: parentId || null, type });
    const doc = await Department.create({
      name, type, parentId: parentId || null,
      depth, order: siblingCount,
      createdBy: req.user.id,
      ...rest
    });

    // Insert into in-memory tree
    tree.insertNode(doc);

    res.status(201).json({ success: true, message: `${type} created.`, data: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/v1/departments/:id
 * Update any node.
 */
exports.update = async (req, res) => {
  try {
    const doc = await Department.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Node not found.' });

    const IMMUTABLE = ['type', 'parentId', 'depth', 'createdBy'];
    Object.entries(req.body).forEach(([k, v]) => {
      if (!IMMUTABLE.includes(k)) doc[k] = v;
    });
    await doc.save();
    
    // Update memory
    const inMemNode = tree._nodeMap.get(doc._id.toString());
    if (inMemNode) {
      inMemNode.data = doc;
    }

    res.json({ success: true, message: 'Updated.', data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/v1/departments/:id
 * Deletes a node and all its descendants.
 */
exports.deleteNode = async (req, res) => {
  try {
    const doc = await Department.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Node not found.' });

    // Collect all descendant IDs via BFS
    const toDelete = [doc._id];
    const queue = [doc._id];
    while (queue.length) {
      const pid = queue.shift();
      const children = await Department.find({ parentId: pid }).select('_id');
      children.forEach(c => { toDelete.push(c._id); queue.push(c._id); });
    }

    await Department.deleteMany({ _id: { $in: toDelete } });

    // Remove from in-memory tree
    tree.deleteNode(doc._id);

    res.json({ success: true, message: `Deleted ${toDelete.length} node(s).`, deletedCount: toDelete.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/departments/seed
 * Seeds a full department tree (admin only).
 */
exports.seed = async (req, res) => {
  try {
    const count = await Department.countDocuments();
    if (count >= 5) return res.json({ success: true, message: 'Already seeded.' });

    const deptData = [
      { name: 'Public Works Dept',        code: 'PWD',  description: 'Roads, bridges, and infrastructure.',    head: 'Rajiv Sharma',   budget: 50000000, location: 'Sector 1, Delhi',   email: 'pwd@delhi.gov.in',   established: 1952 },
      { name: 'Health Services',          code: 'HLTH', description: 'Public health and hospital management.', head: 'Dr. Priya Nair',  budget: 75000000, location: 'Sector 3, Delhi',   email: 'health@delhi.gov.in', established: 1960 },
      { name: 'Education Dept',           code: 'EDU',  description: 'Schools, colleges, and skill dev.',      head: 'Anita Gupta',    budget: 60000000, location: 'Sector 5, Delhi',   email: 'edu@delhi.gov.in',    established: 1947 },
      { name: 'Municipal Services',       code: 'MCD',  description: 'Water, sanitation, and waste mgmt.',     head: 'Suresh Kumar',   budget: 40000000, location: 'Sector 7, Delhi',   email: 'mcd@delhi.gov.in',    established: 1958 },
      { name: 'Finance & Revenue',        code: 'FIN',  description: 'Tax collection and budget allocation.',  head: 'Amit Verma',     budget: 20000000, location: 'Secretariat, Delhi', email: 'finance@delhi.gov.in',established: 1950 },
    ];

    const createdDepts = [];
    for (let i = 0; i < deptData.length; i++) {
      const d = await Department.create({ ...deptData[i], type: 'Department', depth: 0, order: i });
      createdDepts.push(d);
    }

    // Sub-departments per department
    const subDeptData = [
      { parentIdx: 0, subs: ['Road Construction', 'Bridge Maintenance', 'Drainage Systems'] },
      { parentIdx: 1, subs: ['Primary Healthcare', 'Hospital Administration', 'Medical Stores'] },
      { parentIdx: 2, subs: ['Primary Schools', 'Secondary Education', 'Technical Training'] },
      { parentIdx: 3, subs: ['Water Supply', 'Solid Waste', 'Sewerage Management'] },
      { parentIdx: 4, subs: ['Tax Collection', 'Budget Planning', 'Accounts & Audit'] },
    ];

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
      }
    }

    // Employees (2 per sub-department)
    const firstNames = ['Arjun','Pooja','Rahul','Neha','Vijay','Rekha','Anil','Kavya','Sanjay','Divya'];
    const lastNames  = ['Sharma','Patel','Kumar','Singh','Verma','Gupta','Mishra','Joshi','Rao','Nair'];
    const designations = ['Junior Engineer','Senior Clerk','Accountant','Data Analyst','Field Officer','Manager','Inspector','Supervisor'];

    let empCount = 0;
    for (const { sub } of createdSubs) {
      for (let k = 0; k < 2; k++) {
        const fname = firstNames[(empCount + k) % firstNames.length];
        const lname = lastNames[(empCount + k + 3) % lastNames.length];
        await Department.create({
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
        empCount++;
      }
    }

    // Rebuild memory representation
    await rebuildTree();

    res.json({ success: true, message: `Department tree seeded successfully!`, nodeCount: tree.size() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
