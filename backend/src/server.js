const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
const TrafficSimulator = require('./services/trafficSimulator');

// Connect to Database
connectDB();

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust origin for production security
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Set Socket.io instance on app scope
app.set('io', io);

// Global Middleware
if (process.env.NODE_ENV !== 'development') {
  app.use(helmet());
} else {
  app.use(helmet({
    hsts: false,
    contentSecurityPolicy: false
  }));
}
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// REST Route Registrations
const authRoutes       = require('./routes/auth.routes');
const trafficRoutes    = require('./routes/traffic.routes');
const emergencyRoutes  = require('./routes/emergency.routes');
const utilityRoutes    = require('./routes/utility.routes');
const bookingRoutes    = require('./routes/booking.routes');
const citizenRoutes    = require('./routes/citizen.routes');
const departmentRoutes = require('./routes/department.routes');
const searchRoutes     = require('./routes/search.routes');
const dashboardRoutes  = require('./routes/dashboard.routes');

app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/traffic',     trafficRoutes);
app.use('/api/v1/emergency',   emergencyRoutes);
app.use('/api/v1/utility',     utilityRoutes);
app.use('/api/v1/bookings',    bookingRoutes);
app.use('/api/v1/citizens',    citizenRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/search',      searchRoutes);
app.use('/api/v1/dashboard',   dashboardRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Smart City Management System API (v1)',
    timestamp: new Date()
  });
});

// Initialize Traffic Simulator
const trafficSimulator = new TrafficSimulator(io);
trafficSimulator.start();

// Socket.io Real-Time Connections
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current simulator state immediately to new client
  socket.emit('sim_state', trafficSimulator.getState());

  // Send current edge state immediately to new client
  socket.emit('traffic_update', {
    edges: trafficSimulator.edgeState.map(e => ({
      source: e.source, target: e.target,
      density: Math.round(e.density), speed: e.speed, distance: e.distance
    })),
    timestamp: new Date().toISOString()
  });

  socket.on('simulation_control', async ({ action, value }) => {
    if (action === 'start')  trafficSimulator.start();
    if (action === 'stop')   trafficSimulator.stop();
    if (action === 'speed')  trafficSimulator.setSpeed(value);
    if (action === 'spawn_emergency') {
      await trafficSimulator.spawnEmergencyVehicle();
    }
    socket.emit('sim_state', trafficSimulator.getState());
  });

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Room joined: ${room} by socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Global Fallback Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`🚀 Smart City server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = server;


