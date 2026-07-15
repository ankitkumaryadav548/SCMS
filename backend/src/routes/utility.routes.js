const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utility.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/grids', protect, utilityController.getGrids);
router.post('/optimize-distribution', protect, authorize('Operator', 'Admin'), utilityController.optimizeDistribution);

module.exports = router;
