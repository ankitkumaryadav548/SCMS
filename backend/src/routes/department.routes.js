const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/department.controller');

// Stats & Search & BFS & Tree View
router.get('/stats',   protect, ctrl.getStats);
router.get('/search',  protect, ctrl.search);
router.get('/bfs',     protect, ctrl.getBFS);
router.get('/tree',    protect, ctrl.getTree);

// Seed (admin only)
router.post('/seed',   protect, authorize('Admin'), ctrl.seed);

// CRUD
router.route('/')
  .get(protect, ctrl.getAll)
  .post(protect, authorize('Admin', 'Operator'), ctrl.create);

router.route('/:id')
  .get(protect, ctrl.getOne)
  .put(protect, authorize('Admin', 'Operator'), ctrl.update)
  .delete(protect, authorize('Admin'), ctrl.deleteNode);

module.exports = router;
