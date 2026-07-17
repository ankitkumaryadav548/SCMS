const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/search.controller');

router.get('/suggest', protect, ctrl.suggest);    // Trie autocomplete — O(L)
router.get('/stats',   protect, ctrl.stats);      // Index stats
router.get('/',        protect, ctrl.search);     // Full search with DB fallback
router.post('/rebuild',protect, authorize('Admin'), ctrl.rebuild); // Rebuild index

module.exports = router;
