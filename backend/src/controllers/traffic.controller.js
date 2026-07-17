const TrafficSensor = require('../models/TrafficSensor');
const TrafficLog = require('../models/TrafficLog');
const NodeLog = require('../models/NodeLog');
require('dotenv').config();

// Get all traffic sensors
exports.getSensors = async (req, res) => {
  try {
    const sensors = await TrafficSensor.find();
    return res.status(200).json({
      success: true,
      count: sensors.length,
      data: sensors
    });
  } catch (error) {
    console.error('getSensors Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve traffic sensors.'
    });
  }
};

// Update sensor density (realtime trigger)
exports.updateSensor = async (req, res) => {
  const { id } = req.params;
  const { current_density, avg_speed } = req.body;

  if (current_density === undefined || avg_speed === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current_density and avg_speed.'
    });
  }

  try {
    const sensor = await TrafficSensor.findByIdAndUpdate(
      id,
      { current_density, avg_speed },
      { new: true }
    );

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found.'
      });
    }

    // Log to traffic_logs history
    await TrafficLog.create({
      sensor_id: id,
      density: current_density,
      avg_speed
    });

    // Emit socket event for realtime update if io is attached to req
    if (req.app.get('io')) {
      req.app.get('io').emit('traffic_update', {
        sensor_id: id,
        current_density,
        avg_speed,
        timestamp: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sensor updated successfully.',
      data: sensor
    });
  } catch (error) {
    console.error('updateSensor Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update traffic sensor.'
    });
  }
};

// Calculate optimal route by invoking Java Algorithm Engine
exports.calculateOptimalRoute = async (req, res) => {
  const { startNode, endNode, customEdges } = req.body;

  if (!startNode || !endNode) {
    return res.status(400).json({
      success: false,
      message: 'Please provide startNode and endNode.'
    });
  }

  try {
    const javaEngineUrl = process.env.JAVA_ENGINE_URL || 'http://localhost:8081/api/v1';
    
    // Call Java Spring Boot engine
    const response = await fetch(`${javaEngineUrl}/algorithms/shortest-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNode, endNode, customEdges })
    });

    if (!response.ok) {
      throw new Error(`Java engine returned status: ${response.status}`);
    }

    const result = await response.json();

    // Log this decision node (non-blocking if DB is offline)
    try {
      await NodeLog.create({
        module: 'Traffic',
        action: 'Route Optimization Call',
        details: { startNode, endNode, result }
      });
    } catch (dbErr) {
      console.warn('⚠️ Database audit logging failed:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('calculateOptimalRoute Error connecting to Java engine:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute route from Algorithm Engine. Ensure the Java service is running.',
      error: error.message
    });
  }
};
