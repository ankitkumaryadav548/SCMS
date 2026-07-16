/**
 * Navigation Module - Manhattan Intersection Network
 * 
 * Intersections (Nodes) centered in Manhattan, NYC.
 */
export const NAVIGATION_NODES = {
  TimesSquare: { name: 'Times Square', lat: 40.7580, lng: -73.9855 },
  CentralPark: { name: 'Central Park South', lat: 40.7644, lng: -73.9730 },
  GrandCentral: { name: 'Grand Central Terminal', lat: 40.7527, lng: -73.9772 },
  EmpireState: { name: 'Empire State Building', lat: 40.7484, lng: -73.9857 },
  UnionSquare: { name: 'Union Square', lat: 40.7359, lng: -73.9911 },
  WashSquare: { name: 'Washington Square Park', lat: 40.7308, lng: -73.9973 },
  SoHo: { name: 'SoHo District', lat: 40.7233, lng: -74.0030 },
  WallStreet: { name: 'Wall Street', lat: 40.7075, lng: -74.0113 },
  Chinatown: { name: 'Chinatown', lat: 40.7158, lng: -73.9970 },
  EastVillage: { name: 'East Village', lat: 40.7265, lng: -73.9815 },
  ChelseaMarket: { name: 'Chelsea Market', lat: 40.7420, lng: -74.0048 },
  HudsonYards: { name: 'Hudson Yards', lat: 40.7538, lng: -74.0022 }
};

// Connections (Edges) between intersections
export const NAVIGATION_EDGES = [
  { source: 'TimesSquare', target: 'CentralPark', distance: 1.2, baseSpeed: 40, toll: 0, defaultDensity: 35 },
  { source: 'TimesSquare', target: 'GrandCentral', distance: 0.8, baseSpeed: 30, toll: 0, defaultDensity: 65 },
  { source: 'TimesSquare', target: 'HudsonYards', distance: 1.4, baseSpeed: 40, toll: 0, defaultDensity: 20 },
  { source: 'TimesSquare', target: 'EmpireState', distance: 1.1, baseSpeed: 30, toll: 0, defaultDensity: 80 },
  { source: 'CentralPark', target: 'GrandCentral', distance: 1.5, baseSpeed: 45, toll: 0, defaultDensity: 40 },
  { source: 'GrandCentral', target: 'EmpireState', distance: 0.7, baseSpeed: 30, toll: 0, defaultDensity: 70 },
  { source: 'HudsonYards', target: 'ChelseaMarket', distance: 1.3, baseSpeed: 40, toll: 0, defaultDensity: 25 },
  { source: 'ChelseaMarket', target: 'WashSquare', distance: 1.6, baseSpeed: 35, toll: 0, defaultDensity: 30 },
  { source: 'ChelseaMarket', target: 'EmpireState', distance: 1.8, baseSpeed: 35, toll: 0, defaultDensity: 50 },
  { source: 'EmpireState', target: 'UnionSquare', distance: 1.5, baseSpeed: 35, toll: 0, defaultDensity: 60 },
  { source: 'UnionSquare', target: 'EastVillage', distance: 1.0, baseSpeed: 30, toll: 0, defaultDensity: 45 },
  { source: 'UnionSquare', target: 'WashSquare', distance: 0.7, baseSpeed: 30, toll: 0, defaultDensity: 40 },
  { source: 'WashSquare', target: 'SoHo', distance: 0.9, baseSpeed: 30, toll: 0, defaultDensity: 50 },
  { source: 'SoHo', target: 'Chinatown', distance: 1.0, baseSpeed: 25, toll: 0, defaultDensity: 70 },
  { source: 'SoHo', target: 'WallStreet', distance: 2.0, baseSpeed: 45, toll: 5.50, defaultDensity: 15 }, // Toll road simulator
  { source: 'EastVillage', target: 'Chinatown', distance: 1.3, baseSpeed: 30, toll: 0, defaultDensity: 55 },
  { source: 'Chinatown', target: 'WallStreet', distance: 1.2, baseSpeed: 25, toll: 0, defaultDensity: 60 }
];

/**
 * Calculates current speed on an edge factoring in traffic congestion density.
 * Congestion scale: 0 to 100.
 */
export const calculateEdgeSpeed = (baseSpeed, density) => {
  const densityFactor = density / 100;
  // Speed drops by up to 75% under 100% traffic density
  const speed = baseSpeed * (1.0 - 0.75 * densityFactor);
  return Math.max(speed, 5.0); // minimum speed of 5 km/h
};

/**
 * Calculates travel time on an edge in minutes.
 */
export const calculateEdgeTime = (distance, speed) => {
  return (distance / speed) * 60;
};

/**
 * Builds custom edge arrays for the Java Spring Boot Dijkstra API.
 * 
 * @param {string} mode - 'shortest' or 'fastest'
 * @param {number} globalTrafficMultiplier - factor to scale traffic density (0 to 2)
 * @returns {Array} List of custom edges for Dijkstra API
 */
export const buildCustomEdges = (mode, globalTrafficMultiplier = 1.0) => {
  return NAVIGATION_EDGES.map(edge => {
    // scale default traffic density by global multiplier, cap at 100%
    const density = Math.min(Math.max(edge.defaultDensity * globalTrafficMultiplier, 0), 100);
    const speed = calculateEdgeSpeed(edge.baseSpeed, density);
    const time = calculateEdgeTime(edge.distance, speed);

    // weight represents the metric we want Dijkstra to minimize
    const weight = mode === 'fastest' ? time : edge.distance;

    return {
      source: edge.source,
      target: edge.target,
      weight: parseFloat(weight.toFixed(4))
    };
  });
};

/**
 * Calculates total statistics for a computed path.
 * 
 * @param {Array<string>} path - list of node keys
 * @param {number} globalTrafficMultiplier - traffic multiplier
 * @returns {Object} { distance, time, cost }
 */
export const calculatePathStats = (path, globalTrafficMultiplier = 1.0) => {
  if (!path || path.length < 2) {
    return { distance: 0, time: 0, cost: 0 };
  }

  let totalDistance = 0;
  let totalTime = 0;
  let totalTolls = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];

    // Find the edge between u and v
    const edge = NAVIGATION_EDGES.find(
      e => (e.source === u && e.target === v) || (e.source === v && e.target === u)
    );

    if (edge) {
      const density = Math.min(Math.max(edge.defaultDensity * globalTrafficMultiplier, 0), 100);
      const speed = calculateEdgeSpeed(edge.baseSpeed, density);
      const time = calculateEdgeTime(edge.distance, speed);

      totalDistance += edge.distance;
      totalTime += time;
      totalTolls += edge.toll;
    } else {
      // Fallback fallback if edge not directly defined (e.g. geographic estimation)
      totalDistance += 1.0;
      totalTime += 2.0;
    }
  }

  // Cost calculation formula:
  // Fuel cost: $0.15 per km
  // Time value cost: $0.12 per minute of travel
  // Tolls: exact toll values
  const fuelCost = totalDistance * 0.15;
  const timeCost = totalTime * 0.12;
  const totalCost = fuelCost + timeCost + totalTolls;

  return {
    distance: parseFloat(totalDistance.toFixed(2)),
    time: Math.round(totalTime),
    cost: parseFloat(totalCost.toFixed(2))
  };
};

/**
 * Finds the nearest node to a given lat/lng coordinate.
 * Useful for geolocation to snap user to graph.
 */
export const findNearestNode = (lat, lng) => {
  let nearestNode = null;
  let minDistance = Infinity;

  Object.entries(NAVIGATION_NODES).forEach(([key, node]) => {
    // Standard Euclidean distance squared (accurate enough for city scale)
    const dist = Math.pow(node.lat - lat, 2) + Math.pow(node.lng - lng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = key;
    }
  });

  return nearestNode;
};
