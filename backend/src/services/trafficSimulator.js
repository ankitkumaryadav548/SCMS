/**
 * trafficSimulator.js
 * Real-time traffic simulation engine for Smart City Management System.
 * Emits live traffic data via Socket.io every simulation tick.
 */

const EDGES = [
  { source: 'TimesSquare',  target: 'CentralPark',   distance: 1.2, baseSpeed: 40 },
  { source: 'TimesSquare',  target: 'GrandCentral',  distance: 0.8, baseSpeed: 30 },
  { source: 'TimesSquare',  target: 'HudsonYards',   distance: 1.4, baseSpeed: 40 },
  { source: 'TimesSquare',  target: 'EmpireState',   distance: 1.1, baseSpeed: 30 },
  { source: 'CentralPark',  target: 'GrandCentral',  distance: 1.5, baseSpeed: 45 },
  { source: 'GrandCentral', target: 'EmpireState',   distance: 0.7, baseSpeed: 30 },
  { source: 'HudsonYards',  target: 'ChelseaMarket', distance: 1.3, baseSpeed: 40 },
  { source: 'ChelseaMarket',target: 'WashSquare',    distance: 1.6, baseSpeed: 35 },
  { source: 'ChelseaMarket',target: 'EmpireState',   distance: 1.8, baseSpeed: 35 },
  { source: 'EmpireState',  target: 'UnionSquare',   distance: 1.5, baseSpeed: 35 },
  { source: 'UnionSquare',  target: 'EastVillage',   distance: 1.0, baseSpeed: 30 },
  { source: 'UnionSquare',  target: 'WashSquare',    distance: 0.7, baseSpeed: 30 },
  { source: 'WashSquare',   target: 'SoHo',          distance: 0.9, baseSpeed: 30 },
  { source: 'SoHo',         target: 'Chinatown',     distance: 1.0, baseSpeed: 25 },
  { source: 'SoHo',         target: 'WallStreet',    distance: 2.0, baseSpeed: 45 },
  { source: 'EastVillage',  target: 'Chinatown',     distance: 1.3, baseSpeed: 30 },
  { source: 'Chinatown',    target: 'WallStreet',    distance: 1.2, baseSpeed: 25 },
];

const NODES = [
  'TimesSquare','CentralPark','GrandCentral','EmpireState',
  'UnionSquare','WashSquare','SoHo','WallStreet','Chinatown',
  'EastVillage','ChelseaMarket','HudsonYards'
];

const VEHICLE_NAMES = [
  'AMBULANCE-01','FIRE-07','POLICE-14','AMBULANCE-22',
  'FIRE-03','POLICE-09','AMBULANCE-15'
];

const JAVA_ENGINE_URL = process.env.JAVA_ENGINE_URL || 'http://localhost:8081/api/v1';

class TrafficSimulator {
  constructor(io) {
    this.io = io;
    this.running = false;
    this.speedMultiplier = 1.0;
    this.tickInterval = null;
    this.emergencyInterval = null;
    this.activeVehicles = [];

    // Initialize live edge density state
    this.edgeState = EDGES.map(e => ({
      ...e,
      density: Math.floor(Math.random() * 60) + 10,  // start 10-70%
      speed: 0,
    }));
    this._recalcSpeeds();
  }

  _recalcSpeeds() {
    this.edgeState = this.edgeState.map(e => {
      const densityFactor = e.density / 100;
      const speed = Math.max(e.baseSpeed * (1 - 0.75 * densityFactor), 5);
      return { ...e, speed: parseFloat(speed.toFixed(1)) };
    });
  }

  /** Gaussian-like random walk drift for density values */
  _drift(value, sigma = 8) {
    const delta = (Math.random() - 0.5) * sigma * 2;
    return Math.min(100, Math.max(0, value + delta));
  }

  /** Build adjacency list for Java Dijkstra call from current edge state */
  _buildCustomEdges(mode = 'fastest') {
    return this.edgeState.map(e => {
      const time = (e.distance / e.speed) * 60;
      return {
        source: e.source,
        target: e.target,
        weight: parseFloat((mode === 'fastest' ? time : e.distance).toFixed(4))
      };
    });
  }

  /** Call Java engine for shortest path */
  async _callJavaEngine(startNode, endNode, customEdges) {
    try {
      const response = await fetch(`${JAVA_ENGINE_URL}/algorithms/shortest-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNode, endNode, customEdges })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /** Main simulation tick */
  async _tick() {
    const previousState = this.edgeState.map(e => ({ ...e }));

    // Mutate 3-5 random edges
    const mutateCount = Math.floor(Math.random() * 3) + 3;
    const indices = [];
    while (indices.length < mutateCount) {
      const idx = Math.floor(Math.random() * this.edgeState.length);
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.forEach(i => {
      this.edgeState[i] = { ...this.edgeState[i], density: this._drift(this.edgeState[i].density) };
    });
    this._recalcSpeeds();

    // Emit full traffic update
    this.io.emit('traffic_update', {
      edges: this.edgeState.map(e => ({
        source: e.source,
        target: e.target,
        density: Math.round(e.density),
        speed: e.speed,
        distance: e.distance
      })),
      timestamp: new Date().toISOString()
    });

    // Detect new congestion alerts
    this.edgeState.forEach((e, i) => {
      const prev = previousState[i];
      const wasCongested = prev.density > 75;
      const isCongested  = e.density > 75;
      if (!wasCongested && isCongested) {
        const severity = e.density > 90 ? 'CRITICAL' : 'HIGH';
        this.io.emit('congestion_alert', {
          edge: `${e.source} → ${e.target}`,
          source: e.source,
          target: e.target,
          density: Math.round(e.density),
          speed: e.speed,
          severity,
          timestamp: new Date().toISOString()
        });
        console.log(`[TrafficSim] 🚨 Congestion ${severity} on ${e.source}→${e.target} (${Math.round(e.density)}%)`);
      }
    });

    // Move active vehicles along their route
    this.activeVehicles = this.activeVehicles.filter(v => {
      v.elapsed += (2 * this.speedMultiplier);
      return v.elapsed < v.duration;
    });
  }

  /** Spawn an emergency vehicle event */
  async spawnEmergencyVehicle() {
    const availNodes = [...NODES];
    const startIdx = Math.floor(Math.random() * availNodes.length);
    let endIdx = Math.floor(Math.random() * availNodes.length);
    while (endIdx === startIdx) endIdx = Math.floor(Math.random() * availNodes.length);

    const startNode = availNodes[startIdx];
    const endNode   = availNodes[endIdx];
    const vehicleName = VEHICLE_NAMES[Math.floor(Math.random() * VEHICLE_NAMES.length)];

    console.log(`[TrafficSim] 🚑 Emergency vehicle ${vehicleName}: ${startNode} → ${endNode}`);

    // Build low-density edges for priority routing (emergency clears traffic)
    const priorityEdges = this.edgeState.map(e => {
      const prioritySpeed = Math.max(e.baseSpeed * 1.5, 60);  // emergency vehicles go faster
      const time = (e.distance / prioritySpeed) * 60;
      return { source: e.source, target: e.target, weight: parseFloat(time.toFixed(4)) };
    });

    const primaryResult = await this._callJavaEngine(startNode, endNode, priorityEdges);

    // Alternative route with penalized primary edges
    let altPath = null;
    if (primaryResult && primaryResult.path && primaryResult.path.length > 0) {
      const primarySet = new Set();
      for (let i = 0; i < primaryResult.path.length - 1; i++) {
        primarySet.add(`${primaryResult.path[i]}-${primaryResult.path[i+1]}`);
        primarySet.add(`${primaryResult.path[i+1]}-${primaryResult.path[i]}`);
      }
      const penalizedEdges = priorityEdges.map(e => ({
        ...e,
        weight: primarySet.has(`${e.source}-${e.target}`) ? e.weight * 3 : e.weight
      }));
      const altResult = await this._callJavaEngine(startNode, endNode, penalizedEdges);
      if (altResult && altResult.path && JSON.stringify(altResult.path) !== JSON.stringify(primaryResult.path)) {
        altPath = altResult.path;
      }
    }

    const vehiclePayload = {
      vehicleId: vehicleName,
      startNode,
      endNode,
      path: primaryResult?.path || [startNode, endNode],
      alternativePath: altPath,
      executionTime: primaryResult?.executionTime || '0ms',
      timestamp: new Date().toISOString()
    };

    this.io.emit('emergency_route', vehiclePayload);
    this.activeVehicles.push({ ...vehiclePayload, elapsed: 0, duration: 30 });

    return vehiclePayload;
  }

  start() {
    if (this.running) return;
    this.running = true;

    const tickMs = Math.round(2000 / this.speedMultiplier);
    this.tickInterval = setInterval(() => this._tick(), tickMs);

    // Spawn emergency vehicle randomly every 30–90 seconds
    const scheduleEmergency = () => {
      const delay = (30 + Math.random() * 60) * 1000 / this.speedMultiplier;
      this.emergencyInterval = setTimeout(async () => {
        if (this.running) {
          await this.spawnEmergencyVehicle();
          scheduleEmergency();
        }
      }, delay);
    };
    scheduleEmergency();

    console.log('[TrafficSim] ✅ Simulator started (tick: 2s)');
    // Send initial state immediately
    this.io.emit('traffic_update', {
      edges: this.edgeState.map(e => ({
        source: e.source, target: e.target,
        density: Math.round(e.density), speed: e.speed, distance: e.distance
      })),
      timestamp: new Date().toISOString()
    });
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.tickInterval);
    clearTimeout(this.emergencyInterval);
    this.tickInterval = null;
    this.emergencyInterval = null;
    console.log('[TrafficSim] 🛑 Simulator stopped');
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.25, Math.min(4, multiplier));
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  getState() {
    return {
      running: this.running,
      speedMultiplier: this.speedMultiplier,
      edgeCount: this.edgeState.length,
      activeVehicles: this.activeVehicles.length
    };
  }
}

module.exports = TrafficSimulator;
