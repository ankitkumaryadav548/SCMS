const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/traffic.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/sensors', protect, trafficController.getSensors);
router.put('/sensors/:id', protect, authorize('Operator', 'Admin'), trafficController.updateSensor);
router.post('/optimize-route', protect, trafficController.calculateOptimalRoute);

module.exports = router;
