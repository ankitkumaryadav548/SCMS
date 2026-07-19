const mongoose = require('mongoose');
const User = require('../models/User');
const TrafficSensor = require('../models/TrafficSensor');
const TrafficLog = require('../models/TrafficLog');
const EmergencyIncident = require('../models/EmergencyIncident');
const UtilityGrid = require('../models/UtilityGrid');
const NodeLog = require('../models/NodeLog');

async function seedMongo() {
  try {
    // Standard bcrypt hash for 'password123'
    const DEMO_PASSWORD_HASH = '$2a$10$GLuAGaqQzSL5osK61w0rm.E6G4RkwFvKxN1oR5yEUb/3/nLUXTia2';

    // 1. Ensure Demo Accounts always exist & have matching credentials for 'password123'
    const demoAccounts = [
      { name: 'Admin User', email: 'admin@smartcity.gov', password: DEMO_PASSWORD_HASH, role: 'Admin' },
      { name: 'Operator Jane', email: 'jane.operator@smartcity.gov', password: DEMO_PASSWORD_HASH, role: 'Operator' },
      { name: 'John Citizen', email: 'john.doe@gmail.com', password: DEMO_PASSWORD_HASH, role: 'Citizen' },
      { name: 'Guest Visitor', email: 'visitor@smartcity.gov', password: DEMO_PASSWORD_HASH, role: 'Visitor' }
    ];

    for (const acc of demoAccounts) {
      await User.findOneAndUpdate(
        { email: acc.email },
        { $set: { name: acc.name, password: acc.password, role: acc.role } },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Demo user accounts verified and synchronized.');

    const userCount = await User.countDocuments();
    if (userCount > 4) {
      console.log('Database already initialized. Skipping full dataset re-seed.');
      return;
    }

    console.log('🌱 Seeding MongoDB Database...');

    // 2. Seed Traffic Sensors
    const sensorIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ];

    const sensors = [
      {
        _id: sensorIds[0],
        name: 'Central Avenue Intersection',
        location_lat: 28.630400,
        location_lng: 77.217700,
        status: 'Active',
        current_density: 75,
        avg_speed: 22.50
      },
      {
        _id: sensorIds[1],
        name: 'West Highway Tollgate',
        location_lat: 28.612900,
        location_lng: 77.229500,
        status: 'Active',
        current_density: 40,
        avg_speed: 58.20
      },
      {
        _id: sensorIds[2],
        name: 'North Boulevard Cross',
        location_lat: 28.642900,
        location_lng: 77.221700,
        status: 'Active',
        current_density: 95,
        avg_speed: 12.00
      },
      {
        _id: sensorIds[3],
        name: 'East Bridge Entrance',
        location_lat: 28.614300,
        location_lng: 77.200200,
        status: 'Maintenance',
        current_density: 0,
        avg_speed: 0.00
      },
      {
        _id: sensorIds[4],
        name: 'South Park Street Gate',
        location_lat: 28.644400,
        location_lng: 77.190300,
        status: 'Active',
        current_density: 25,
        avg_speed: 42.10
      }
    ];
    await TrafficSensor.insertMany(sensors);
    console.log('✅ Traffic sensors seeded.');

    // 3. Seed Traffic Logs
    const trafficLogs = [
      { sensor_id: sensorIds[0], density: 80, avg_speed: 20.00, logged_at: new Date(Date.now() - 4 * 3600000) },
      { sensor_id: sensorIds[0], density: 85, avg_speed: 18.50, logged_at: new Date(Date.now() - 3 * 3600000) },
      { sensor_id: sensorIds[0], density: 70, avg_speed: 25.00, logged_at: new Date(Date.now() - 2 * 3600000) },
      { sensor_id: sensorIds[0], density: 75, avg_speed: 22.50, logged_at: new Date(Date.now() - 1 * 3600000) },
      { sensor_id: sensorIds[1], density: 35, avg_speed: 62.00, logged_at: new Date(Date.now() - 3 * 3600000) },
      { sensor_id: sensorIds[1], density: 45, avg_speed: 55.00, logged_at: new Date(Date.now() - 2 * 3600000) },
      { sensor_id: sensorIds[1], density: 40, avg_speed: 58.20, logged_at: new Date(Date.now() - 1 * 3600000) },
      { sensor_id: sensorIds[2], density: 90, avg_speed: 15.00, logged_at: new Date(Date.now() - 2 * 3600000) },
      { sensor_id: sensorIds[2], density: 95, avg_speed: 12.00, logged_at: new Date(Date.now() - 1 * 3600000) }
    ];
    await TrafficLog.insertMany(trafficLogs);
    console.log('✅ Traffic logs seeded.');

    // 4. Seed Emergency Incidents
    const emergencyIncidents = [
      {
        title: 'Main St Warehouse Fire',
        description: 'Large commercial building fire reported. Heavy smoke.',
        type: 'Fire',
        severity: 'Critical',
        location_lat: 28.656200,
        location_lng: 77.241000,
        status: 'Dispatched',
        reported_by: userIds.operator
      },
      {
        title: 'Route 9 Accident',
        description: 'Two-car collision blocking the right lane. No major injuries.',
        type: 'Accident',
        severity: 'Medium',
        location_lat: 28.645000,
        location_lng: 77.158500,
        status: 'Reported',
        reported_by: userIds.citizen
      },
      {
        title: 'City Center Water Main Burst',
        description: 'Water main burst flooding the lower subway tunnel entrance.',
        type: 'Flood',
        severity: 'High',
        location_lat: 28.650600,
        location_lng: 77.230300,
        status: 'Resolved',
        reported_by: userIds.admin
      }
    ];
    await EmergencyIncident.insertMany(emergencyIncidents);
    console.log('✅ Emergency incidents seeded.');

    // 5. Seed Utility Grids
    const utilityGrids = [
      {
        name: 'Downtown Substation A',
        type: 'Electricity',
        capacity: 5000.00,
        current_load: 4200.50,
        status: 'Normal',
        location_lat: 28.630400,
        location_lng: 77.217700
      },
      {
        name: 'East District Water Reservoir',
        type: 'Water',
        capacity: 12000.00,
        current_load: 8500.00,
        status: 'Normal',
        location_lat: 28.612900,
        location_lng: 77.229500
      },
      {
        name: 'North Gas Distributary 3',
        type: 'Gas',
        capacity: 3000.00,
        current_load: 2950.00,
        status: 'Overloaded',
        location_lat: 28.650600,
        location_lng: 77.230300
      }
    ];
    await UtilityGrid.insertMany(utilityGrids);
    console.log('✅ Utility grids seeded.');

    // 6. Seed Node Logs
    const nodeLogs = [
      {
        module: 'Emergency',
        action: 'Dispatched Fire Unit',
        details: { incident_id: 1, station: 'Station 4', units: ['Engine 12', 'Ladder 5'] }
      },
      {
        module: 'Utility',
        action: 'Load Balancing Advisory Triggered',
        details: { grid_id: 3, current_load: 2950.00, threshold: 2700.00, action: 'Reroute 250 units via Sub-grid 2' }
      }
    ];
    await NodeLog.insertMany(nodeLogs);
    console.log('✅ Node logs seeded.');
    console.log('🎉 MongoDB Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding MongoDB:', error.message);
  }
}

module.exports = seedMongo;
console.log('🎉 MongoDB Seeding completed successfully!');
  } catch (error) {
  console.error('❌ Error seeding MongoDB:', error.message);
}
}

module.exports = seedMongo;
