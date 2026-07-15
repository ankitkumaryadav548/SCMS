const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/incidents', protect, emergencyController.getIncidents);
router.post('/incidents', protect, emergencyController.reportIncident);
router.patch('/incidents/:id/status', protect, authorize('Operator', 'Admin'), emergencyController.updateIncidentStatus);

module.exports = router;
