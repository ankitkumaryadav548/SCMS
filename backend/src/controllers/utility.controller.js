const db = require('../config/db');
require('dotenv').config();

// Get all utility grids
exports.getGrids = async (req, res) => {
  try {
    const [grids] = await db.query('SELECT * FROM utility_grids');
    return res.status(200).json({
      success: true,
      data: grids
    });
  } catch (error) {
    console.error('getGrids Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve utility grid data.'
    });
  }
};

// Calculate optimal MST routing for power/water distribution
exports.optimizeDistribution = async (req, res) => {
  const { nodeIds } = req.body; // Array of grid nodes to connect

  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Provide at least 2 node IDs to compute connection MST.'
    });
  }

  try {
    const javaEngineUrl = process.env.JAVA_ENGINE_URL || 'http://localhost:8081/api/v1';

    // Query Java Engine for Kruskal's / Prim's Spanning Tree calculations
    const response = await fetch(`${javaEngineUrl}/algorithms/mst`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeIds })
    });

    if (!response.ok) {
      throw new Error(`Java engine returned status: ${response.status}`);
    }

    const result = await response.json();

    // Log the event
    await db.query(
      "INSERT INTO node_logs (module, action, details) VALUES ('Utility', 'MST Spanning Layout', ?)",
      [JSON.stringify({ input_nodes: nodeIds, mst_output: result })]
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('optimizeDistribution Error connecting to Java engine:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute Spanning Tree layout. Ensure Java Engine is running.',
      error: error.message
    });
  }
};
