const Citizen    = require('../models/Citizen');
const Department = require('../models/Department');

// ═══════════════════════════════════════════════════════════
//  TRIE DATA STRUCTURE
//
//  A compressed prefix tree that enables O(L) autocomplete
//  where L = length of the search prefix.
//
//  Each TrieNode stores:
//    children  — character → TrieNode map
//    results   — up to MAX_RESULTS matching records per node
//    isEnd     — marks end of an inserted word
//
//  Operations:
//    insert(word, meta)   → O(L)
//    suggest(prefix)      → O(L + k)  k = result count
//    size()               → O(1)
//
//  The search index stores Citizens, Departments, and
//  Locations as separate categories in the same trie.
// ═══════════════════════════════════════════════════════════
const MAX_RESULTS_PER_NODE = 8;   // max stored results per prefix node

class TrieNode {
  constructor() {
    this.children = {};   // char → TrieNode
    this.isEnd    = false;
    this.results  = [];   // { category, label, subLabel, id, route, score }
  }
}

class Trie {
  constructor() {
    this.root  = new TrieNode();
    this._size = 0;       // unique words inserted
  }

  // Insert a word and associate metadata — O(L)
  insert(word, meta) {
    if (!word || word.length < 1) return;
    let node = this.root;
    const lower = word.toLowerCase().trim();

    for (const ch of lower) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }
      node = node.children[ch];
      // Store result on every prefix node (bounded list)
      if (!node.results.find(r => r.id === meta.id && r.category === meta.category)) {
        if (node.results.length < MAX_RESULTS_PER_NODE) {
          node.results.push(meta);
        }
      }
    }

    if (!node.isEnd) {
      node.isEnd = true;
      this._size++;
    }
  }

  // Retrieve suggestions for a prefix — O(L + k)
  suggest(prefix) {
    if (!prefix || !prefix.trim()) return [];
    let node = this.root;
    const lower = prefix.toLowerCase().trim();

    for (const ch of lower) {
      if (!node.children[ch]) return []; // prefix not found
      node = node.children[ch];
    }

    return node.results;
  }

  // Full DFS collect all results under a prefix node (for broader queries)
  _collectAll(node, results, limit = 20) {
    if (results.length >= limit) return;
    for (const r of node.results) {
      if (!results.find(x => x.id === r.id && x.category === r.category)) {
        results.push(r);
        if (results.length >= limit) return;
      }
    }
    for (const ch of Object.keys(node.children)) {
      this._collectAll(node.children[ch], results, limit);
      if (results.length >= limit) return;
    }
  }

  size() { return this._size; }

  clear() {
    this.root  = new TrieNode();
    this._size = 0;
  }
}

// ── Module-level search trie (global) ──────────────────────
const searchTrie = new Trie();

// ── Well-known Indian cities / locations seeded into trie ───
const LOCATIONS = [
  { name: 'New Delhi',     state: 'Delhi',         type: 'Capital' },
  { name: 'Mumbai',        state: 'Maharashtra',    type: 'Metro' },
  { name: 'Bangalore',     state: 'Karnataka',      type: 'Metro' },
  { name: 'Chennai',       state: 'Tamil Nadu',     type: 'Metro' },
  { name: 'Kolkata',       state: 'West Bengal',    type: 'Metro' },
  { name: 'Hyderabad',     state: 'Telangana',      type: 'Metro' },
  { name: 'Ahmedabad',     state: 'Gujarat',        type: 'Metro' },
  { name: 'Pune',          state: 'Maharashtra',    type: 'City' },
  { name: 'Jaipur',        state: 'Rajasthan',      type: 'City' },
  { name: 'Surat',         state: 'Gujarat',        type: 'City' },
  { name: 'Lucknow',       state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Kanpur',        state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Nagpur',        state: 'Maharashtra',    type: 'City' },
  { name: 'Indore',        state: 'Madhya Pradesh', type: 'City' },
  { name: 'Thane',         state: 'Maharashtra',    type: 'City' },
  { name: 'Bhopal',        state: 'Madhya Pradesh', type: 'City' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', type: 'City' },
  { name: 'Pimpri',        state: 'Maharashtra',    type: 'City' },
  { name: 'Patna',         state: 'Bihar',          type: 'City' },
  { name: 'Vadodara',      state: 'Gujarat',        type: 'City' },
  { name: 'Ghaziabad',     state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Ludhiana',      state: 'Punjab',         type: 'City' },
  { name: 'Agra',          state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Nashik',        state: 'Maharashtra',    type: 'City' },
  { name: 'Faridabad',     state: 'Haryana',        type: 'City' },
  { name: 'Meerut',        state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Rajkot',        state: 'Gujarat',        type: 'City' },
  { name: 'Varanasi',      state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Srinagar',      state: 'J & K',          type: 'City' },
  { name: 'Aurangabad',    state: 'Maharashtra',    type: 'City' },
  { name: 'Dhanbad',       state: 'Jharkhand',      type: 'City' },
  { name: 'Amritsar',      state: 'Punjab',         type: 'City' },
  { name: 'Navi Mumbai',   state: 'Maharashtra',    type: 'City' },
  { name: 'Allahabad',     state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Ranchi',        state: 'Jharkhand',      type: 'City' },
  { name: 'Howrah',        state: 'West Bengal',    type: 'City' },
  { name: 'Coimbatore',    state: 'Tamil Nadu',     type: 'City' },
  { name: 'Jabalpur',      state: 'Madhya Pradesh', type: 'City' },
  { name: 'Gwalior',       state: 'Madhya Pradesh', type: 'City' },
  { name: 'Vijayawada',    state: 'Andhra Pradesh', type: 'City' },
  { name: 'Jodhpur',       state: 'Rajasthan',      type: 'City' },
  { name: 'Madurai',       state: 'Tamil Nadu',     type: 'City' },
  { name: 'Raipur',        state: 'Chhattisgarh',   type: 'City' },
  { name: 'Kota',          state: 'Rajasthan',      type: 'City' },
  { name: 'Chandigarh',    state: 'Punjab',         type: 'City' },
  { name: 'Guwahati',      state: 'Assam',          type: 'City' },
  { name: 'Solapur',       state: 'Maharashtra',    type: 'City' },
  { name: 'Hubballi',      state: 'Karnataka',      type: 'City' },
  { name: 'Noida',         state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Jalandhar',     state: 'Punjab',         type: 'City' },
  { name: 'Mysore',        state: 'Karnataka',      type: 'City' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu',   type: 'City' },
  { name: 'Bareilly',      state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Aligarh',       state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Moradabad',     state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Gorakhpur',     state: 'Uttar Pradesh',  type: 'City' },
  { name: 'Jammu',         state: 'J & K',          type: 'City' },
  { name: 'Mangalore',     state: 'Karnataka',      type: 'City' },
  { name: 'Erode',         state: 'Tamil Nadu',     type: 'City' },
  { name: 'Tiruppur',      state: 'Tamil Nadu',     type: 'City' },
  { name: 'Bikaner',       state: 'Rajasthan',      type: 'City' },
  { name: 'Siliguri',      state: 'West Bengal',    type: 'City' },
  { name: 'Nellore',       state: 'Andhra Pradesh', type: 'City' },
  { name: 'Udaipur',       state: 'Rajasthan',      type: 'City' },
  { name: 'Kolhapur',      state: 'Maharashtra',    type: 'City' },
  { name: 'Guntur',        state: 'Andhra Pradesh', type: 'City' },
];

// ── Index builders ──────────────────────────────────────────
const indexLocations = () => {
  LOCATIONS.forEach((loc, idx) => {
    const meta = {
      id:       `loc-${idx}`,
      category: 'Location',
      label:    loc.name,
      subLabel: `${loc.state} · ${loc.type}`,
      route:    '/navigation',
      icon:     'MapPin',
      score:    loc.type === 'Capital' ? 100 : loc.type === 'Metro' ? 90 : 70,
    };
    // Index every word of the city name
    loc.name.split(/\s+/).forEach(word => searchTrie.insert(word, meta));
    searchTrie.insert(loc.name, meta);
  });
};

const indexCitizens = async () => {
  const citizens = await Citizen.find().select('name citizenId email phone occupation address category status').limit(500);
  citizens.forEach(c => {
    const meta = {
      id:       c._id.toString(),
      category: 'Citizen',
      label:    c.name,
      subLabel: `${c.citizenId} · ${c.address?.ward || ''} · ${c.occupation || ''}`.trim().replace(/·\s*·/, '·'),
      route:    '/citizens',
      icon:     'User',
      score:    80,
      badge:    c.status,
    };
    // Index name parts + citizenId + email prefix
    c.name.split(/\s+/).forEach(word => searchTrie.insert(word, meta));
    searchTrie.insert(c.name, meta);
    if (c.citizenId) searchTrie.insert(c.citizenId, meta);
    if (c.email) searchTrie.insert(c.email.split('@')[0], meta);
  });
};

const indexDepartments = async () => {
  const nodes = await Department.find().select('name code type head designation employeeId description').limit(300);
  nodes.forEach(d => {
    const meta = {
      id:       d._id.toString(),
      category: d.type === 'Employee' ? 'Employee' : 'Department',
      label:    d.name,
      subLabel: d.type === 'Employee'
        ? `${d.designation || ''} · ${d.employeeId || ''}`.replace(/^·\s*|·\s*$/, '')
        : `${d.type} · Head: ${d.head || '—'}`,
      route:    '/departments',
      icon:     d.type === 'Employee' ? 'User' : d.type === 'Department' ? 'Building' : 'Network',
      score:    d.type === 'Department' ? 95 : d.type === 'SubDepartment' ? 85 : 75,
    };
    d.name.split(/\s+/).forEach(word => searchTrie.insert(word, meta));
    searchTrie.insert(d.name, meta);
    if (d.code)       searchTrie.insert(d.code, meta);
    if (d.head)       d.head.split(/\s+/).forEach(w => searchTrie.insert(w, meta));
    if (d.employeeId) searchTrie.insert(d.employeeId, meta);
  });
};

// ── Rebuild the entire search index ─────────────────────────
const rebuildIndex = async () => {
  try {
    searchTrie.clear();
    indexLocations();                   // synchronous — locations are static
    await indexCitizens();
    await indexDepartments();
    console.log(`🔍 Search Trie index built: ${searchTrie.size()} words.`);
  } catch (err) {
    console.error('Search index rebuild failed:', err.message);
  }
};

rebuildIndex();

// ══════════════════════════════════════════════════════════
//  CONTROLLERS
// ══════════════════════════════════════════════════════════

/**
 * GET /api/v1/search/suggest?q=
 * Returns autocomplete suggestions from the trie — O(L)
 */
exports.suggest = (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.trim().length < 1) return res.json({ success: true, data: [] });

  const raw = searchTrie.suggest(q.trim());
  // Deduplicate by id+category, sort by score desc
  const seen = new Set();
  const results = [];
  for (const r of raw) {
    const key = `${r.category}:${r.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(r);
    }
    if (results.length >= Number(limit)) break;
  }
  results.sort((a, b) => (b.score || 0) - (a.score || 0));

  res.json({ success: true, data: results, query: q.trim(), source: 'Trie-O(L)', count: results.length });
};

/**
 * GET /api/v1/search?q=&category=
 * Full search — trie lookup + MongoDB fallback for broader results
 */
exports.search = async (req, res) => {
  try {
    const { q, category, limit = 20 } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, data: [], categories: {} });

    const query = q.trim();

    // 1. Trie prefix match
    const trieResults = searchTrie.suggest(query);

    // 2. MongoDB full-text fallback for Citizens (broader match)
    let citizenResults = [];
    if (!category || category === 'Citizen') {
      const regex = new RegExp(query, 'i');
      const citizens = await Citizen
        .find({ $or: [{ name: regex }, { citizenId: regex }, { email: regex }, { phone: regex }] })
        .select('name citizenId email address category status occupation')
        .limit(10);
      citizenResults = citizens.map(c => ({
        id:       c._id.toString(),
        category: 'Citizen',
        label:    c.name,
        subLabel: `${c.citizenId} · ${c.address?.ward || ''} · ${c.category || ''}`,
        route:    '/citizens',
        icon:     'User',
        badge:    c.status,
        score:    75,
      }));
    }

    // 3. MongoDB fallback for Departments
    let deptResults = [];
    if (!category || category === 'Department' || category === 'Employee') {
      const regex = new RegExp(query, 'i');
      const depts = await Department
        .find({ $or: [{ name: regex }, { code: regex }, { head: regex }, { employeeId: regex }, { designation: regex }] })
        .select('name code type head designation employeeId')
        .limit(8);
      deptResults = depts.map(d => ({
        id:       d._id.toString(),
        category: d.type === 'Employee' ? 'Employee' : 'Department',
        label:    d.name,
        subLabel: d.type === 'Employee'
          ? `${d.designation || ''} · ${d.employeeId || ''}`
          : `${d.type} · Head: ${d.head || '—'}`,
        route:    '/departments',
        icon:     d.type === 'Employee' ? 'User' : 'Building',
        score:    80,
      }));
    }

    // 4. Location filter from static list
    const locResults = !category || category === 'Location'
      ? LOCATIONS
          .filter(l => l.name.toLowerCase().startsWith(query.toLowerCase()) || l.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6)
          .map((l, i) => ({
            id:       `loc-${i}`,
            category: 'Location',
            label:    l.name,
            subLabel: `${l.state} · ${l.type}`,
            route:    '/navigation',
            icon:     'MapPin',
            score:    90,
          }))
      : [];

    // Merge: trie first, then DB fallback, dedup
    const all = [...trieResults, ...citizenResults, ...deptResults, ...locResults];
    const seen  = new Set();
    const final = [];
    for (const r of all) {
      const key = `${r.category}:${r.id}`;
      if (!seen.has(key)) { seen.add(key); final.push(r); }
      if (final.length >= Number(limit)) break;
    }

    // Category grouping
    const categories = {};
    final.forEach(r => { categories[r.category] = (categories[r.category] || 0) + 1; });

    res.json({ success: true, data: final, categories, query, count: final.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/search/rebuild  (admin only)
 * Re-indexes all data into the trie.
 */
exports.rebuild = async (req, res) => {
  try {
    await rebuildIndex();
    res.json({ success: true, message: `Search trie rebuilt. ${searchTrie.size()} words indexed.`, words: searchTrie.size() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/search/stats
 * Returns trie stats.
 */
exports.stats = (req, res) => {
  res.json({
    success: true,
    data: {
      trieWords:  searchTrie.size(),
      locations:  LOCATIONS.length,
      categories: ['Location', 'Citizen', 'Department', 'Employee'],
    }
  });
};
