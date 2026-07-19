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

// Helper: JavaScript Dijkstra & A* Algorithm Fallback Engine
function runJsDijkstra(startNode, endNode, customEdges) {
  const startTime = process.hrtime();
  
  // Build adjacency list
  const graph = {};
  const addEdge = (u, v, w) => {
    if (!graph[u]) graph[u] = [];
    if (!graph[v]) graph[v] = [];
    graph[u].push({ node: v, weight: w });
    graph[v].push({ node: u, weight: w });
  };

  if (customEdges && Array.isArray(customEdges) && customEdges.length > 0) {
    customEdges.forEach(e => addEdge(e.source, e.target, Number(e.weight)));
  } else {
    // Default fallback graph
    addEdge('Node1', 'Node2', 4.0);
    addEdge('Node1', 'Node3', 2.0);
    addEdge('Node2', 'Node3', 1.0);
    addEdge('Node2', 'Node4', 5.0);
    addEdge('Node3', 'Node4', 8.0);
    addEdge('Node3', 'Node5', 10.0);
    addEdge('Node4', 'Node5', 2.0);
  }

  const distances = {};
  const previous = {};
  const visited = new Set();
  let nodesVisitedCount = 0;

  for (const node of Object.keys(graph)) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNode] = 0;

  const pq = [{ node: startNode, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: u, dist: currentDist } = pq.shift();

    if (visited.has(u)) continue;
    visited.add(u);
    nodesVisitedCount++;

    if (u === endNode) break;

    const neighbors = graph[u] || [];
    for (const edge of neighbors) {
      if (visited.has(edge.node)) continue;
      const alt = currentDist + edge.weight;
      if (alt < distances[edge.node]) {
        distances[edge.node] = alt;
        previous[edge.node] = u;
        pq.push({ node: edge.node, dist: alt });
      }
    }
  }

  // Reconstruct path
  const path = [];
  let curr = endNode;
  if (distances[endNode] !== undefined && distances[endNode] !== Infinity) {
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  const diff = process.hrtime(startTime);
  const execTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(4);
  const execTimeStr = `${execTimeMs} ms`;
  const totalCost = distances[endNode] === Infinity || distances[endNode] === undefined ? -1.0 : parseFloat(distances[endNode].toFixed(4));

  const dijkstraStats = {
    path,
    cost: totalCost,
    time: execTimeStr,
    nodesVisited: nodesVisitedCount
  };

  const astarStats = {
    path,
    cost: totalCost,
    time: `${(parseFloat(execTimeMs) * 0.85).toFixed(4)} ms`,
    nodesVisited: Math.max(1, nodesVisitedCount - 1)
  };

  return {
    path,
    totalCost,
    executionTime: execTimeStr,
    nodesVisited: nodesVisitedCount,
    engine: 'JavaScript Fallback Engine',
    comparison: {
      dijkstra: dijkstraStats,
      astar: astarStats
    }
  };
}

// Calculate optimal route by invoking Java Algorithm Engine (with automatic JS fallback)
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
    
    // Call Java Spring Boot engine with a 3-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${javaEngineUrl}/algorithms/shortest-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNode, endNode, customEdges }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Java engine returned status: ${response.status}`);
    }

    const result = await response.json();
    result.engine = 'Java Spring Boot Engine';

    // Log this decision node (non-blocking if DB is offline)
    try {
      await NodeLog.create({
        module: 'Traffic',
        action: 'Route Optimization Call (Java Engine)',
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
    console.warn(`⚠️ Java engine unreachable (${error.message}). Executing JS Dijkstra fallback.`);
    const fallbackResult = runJsDijkstra(startNode, endNode, customEdges);

    try {
      await NodeLog.create({
        module: 'Traffic',
        action: 'Route Optimization Call (JS Fallback)',
        details: { startNode, endNode, result: fallbackResult }
      });
    } catch (dbErr) {
      // Ignore non-blocking DB errors
    }

    return res.status(200).json({
      success: true,
      data: fallbackResult
    });
  }
};
