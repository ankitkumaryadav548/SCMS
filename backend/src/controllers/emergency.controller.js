const db = require('../config/db');

// Get all incidents
exports.getIncidents = async (req, res) => {
  try {
    const [incidents] = await db.query(
      `SELECT e.*, u.name as reporter_name 
       FROM emergency_incidents e 
       LEFT JOIN users u ON e.reported_by = u.id 
       ORDER BY e.created_at DESC`
    );
    return res.status(200).json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('getIncidents Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve incidents.'
    });
  }
};

// Report a new emergency incident (Citizen or Operator)
exports.reportIncident = async (req, res) => {
  const { title, description, type, severity, location_lat, location_lng } = req.body;

  if (!title || !type || !severity || !location_lat || !location_lng) {
    return res.status(400).json({
      success: false,
      message: 'Missing required incident fields.'
    });
  }

  try {
    const userId = req.user ? req.user.id : null;

    const [result] = await db.query(
      `INSERT INTO emergency_incidents 
       (title, description, type, severity, location_lat, location_lng, status, reported_by) 
       VALUES (?, ?, ?, ?, ?, ?, 'Reported', ?)`,
      [title, description, type, severity, location_lat, location_lng, userId]
    );

    const newIncident = {
      id: result.insertId,
      title,
      description,
      type,
      severity,
      location_lat,
      location_lng,
      status: 'Reported',
      reported_by: userId,
      created_at: new Date()
    };

    // Emit real-time incident event
    if (req.app.get('io')) {
      req.app.get('io').emit('new_incident', newIncident);
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency incident reported successfully.',
      data: newIncident
    });
  } catch (error) {
    console.error('reportIncident Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report incident.'
    });
  }
};

// Update incident status (e.g. Dispatch unit or Resolve)
exports.updateIncidentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Reported', 'Dispatched', 'Resolved', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid incident status.'
    });
  }

  try {
    const [result] = await db.query(
      'UPDATE emergency_incidents SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    // Retrieve full incident details to notify clients
    const [updated] = await db.query('SELECT * FROM emergency_incidents WHERE id = ?', [id]);

    // Emit event
    if (req.app.get('io')) {
      req.app.get('io').emit('incident_status_change', updated[0]);
    }

    // Log the change
    await db.query(
      "INSERT INTO node_logs (module, action, details) VALUES ('Emergency', 'Incident Status Update', ?)",
      [JSON.stringify({ incident_id: id, status })]
    );

    return res.status(200).json({
      success: true,
      message: 'Incident status updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    console.error('updateIncidentStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update incident.'
    });
  }
};
