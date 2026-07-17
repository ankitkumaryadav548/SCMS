const EmergencyIncident = require('../models/EmergencyIncident');
const NodeLog = require('../models/NodeLog');

// Get all incidents
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await EmergencyIncident.find()
      .populate('reported_by', 'name')
      .sort({ created_at: -1 });

    const formattedIncidents = incidents.map(e => {
      const obj = e.toJSON();
      obj.reporter_name = e.reported_by ? e.reported_by.name : null;
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: formattedIncidents
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

    const newIncident = await EmergencyIncident.create({
      title,
      description,
      type,
      severity,
      location_lat,
      location_lng,
      status: 'Reported',
      reported_by: userId
    });

    // Populate reporter name for clients
    const populated = await EmergencyIncident.findById(newIncident._id).populate('reported_by', 'name');
    const responseData = populated.toJSON();
    responseData.reporter_name = populated.reported_by ? populated.reported_by.name : null;

    // Emit real-time incident event
    if (req.app.get('io')) {
      req.app.get('io').emit('new_incident', responseData);
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency incident reported successfully.',
      data: responseData
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
    const updated = await EmergencyIncident.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('reported_by', 'name');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    const responseData = updated.toJSON();
    responseData.reporter_name = updated.reported_by ? updated.reported_by.name : null;

    // Emit event
    if (req.app.get('io')) {
      req.app.get('io').emit('incident_status_change', responseData);
    }

    // Log the change
    await NodeLog.create({
      module: 'Emergency',
      action: 'Incident Status Update',
      details: { incident_id: id, status }
    });

    return res.status(200).json({
      success: true,
      message: 'Incident status updated successfully.',
      data: responseData
    });
  } catch (error) {
    console.error('updateIncidentStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update incident.'
    });
  }
};
