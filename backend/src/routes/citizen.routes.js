const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/citizen.controller');

// ── Stats ─────────────────────────────────────────────────
router.get('/stats',        protect, ctrl.getStats);

// ── Linked-list search ────────────────────────────────────
router.get('/search',       protect, ctrl.searchCitizens);

// ── Seed (admin / dev) ────────────────────────────────────
router.post('/seed',        protect, authorize('Admin'), ctrl.seedDemoCitizens);

// ── History for a citizen ─────────────────────────────────
router.get('/:id/history',  protect, ctrl.getCitizenHistory);

// ── CRUD ──────────────────────────────────────────────────
router.route('/')
  .get(protect,  ctrl.getCitizens)
  .post(protect, authorize('Admin', 'Operator'), ctrl.createCitizen);

router.route('/:id')
  .get(protect,    ctrl.getCitizen)
  .put(protect,    authorize('Admin', 'Operator'), ctrl.updateCitizen)
  .delete(protect, authorize('Admin'), ctrl.deleteCitizen);

module.exports = router;
