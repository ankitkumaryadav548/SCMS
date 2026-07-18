/**
 * Navigation Module - New Delhi Intersection Network
 * 
 * Intersections (Nodes) centered in New Delhi, India.
 */
export const NAVIGATION_NODES = {
  ConnaughtPlace:          { name: 'Connaught Place',          lat: 28.6304, lng: 77.2177 },
  IndiaGate:               { name: 'India Gate',               lat: 28.6129, lng: 77.2295 },
  NewDelhiRailwayStation:  { name: 'New Delhi Railway Station',lat: 28.6429, lng: 77.2217 },
  RashtrapatiBhavan:       { name: 'Rashtrapati Bhavan',       lat: 28.6143, lng: 77.2002 },
  KarolBagh:               { name: 'Karol Bagh',               lat: 28.6444, lng: 77.1903 },
  RajendraPlace:           { name: 'Rajendra Place',           lat: 28.6425, lng: 77.1780 },
  PatelNagar:              { name: 'Patel Nagar',              lat: 28.6450, lng: 77.1585 },
  ChandniChowk:            { name: 'Chandni Chowk',            lat: 28.6506, lng: 77.2303 },
  RedFort:                 { name: 'Red Fort',                 lat: 28.6562, lng: 77.2410 },
  RajGhat:                 { name: 'Raj Ghat',                 lat: 28.6406, lng: 77.2495 },
  LodhiGarden:             { name: 'Lodhi Garden',             lat: 28.5933, lng: 77.2189 },
  SafdarjungTomb:          { name: 'Safdarjung Tomb',          lat: 28.5893, lng: 77.2106 }
};

// Connections (Edges) between intersections
export const NAVIGATION_EDGES = [
  { source: 'ConnaughtPlace',         target: 'IndiaGate',              distance: 1.2, baseSpeed: 40, toll: 0, defaultDensity: 35 },
  { source: 'ConnaughtPlace',         target: 'NewDelhiRailwayStation', distance: 0.8, baseSpeed: 30, toll: 0, defaultDensity: 65 },
  { source: 'ConnaughtPlace',         target: 'SafdarjungTomb',         distance: 1.4, baseSpeed: 40, toll: 0, defaultDensity: 20 },
  { source: 'ConnaughtPlace',         target: 'RashtrapatiBhavan',      distance: 1.1, baseSpeed: 30, toll: 0, defaultDensity: 80 },
  { source: 'IndiaGate',              target: 'NewDelhiRailwayStation', distance: 1.5, baseSpeed: 45, toll: 0, defaultDensity: 40 },
  { source: 'NewDelhiRailwayStation', target: 'RashtrapatiBhavan',      distance: 0.7, baseSpeed: 30, toll: 0, defaultDensity: 70 },
  { source: 'SafdarjungTomb',         target: 'LodhiGarden',            distance: 1.3, baseSpeed: 40, toll: 0, defaultDensity: 25 },
  { source: 'LodhiGarden',            target: 'RajendraPlace',          distance: 1.6, baseSpeed: 35, toll: 0, defaultDensity: 30 },
  { source: 'LodhiGarden',            target: 'RashtrapatiBhavan',      distance: 1.8, baseSpeed: 35, toll: 0, defaultDensity: 50 },
  { source: 'RashtrapatiBhavan',      target: 'KarolBagh',              distance: 1.5, baseSpeed: 35, toll: 0, defaultDensity: 60 },
  { source: 'KarolBagh',              target: 'RajGhat',                distance: 1.0, baseSpeed: 30, toll: 0, defaultDensity: 45 },
  { source: 'KarolBagh',              target: 'RajendraPlace',          distance: 0.7, baseSpeed: 30, toll: 0, defaultDensity: 40 },
  { source: 'RajendraPlace',          target: 'PatelNagar',             distance: 0.9, baseSpeed: 30, toll: 0, defaultDensity: 50 },
  { source: 'PatelNagar',             target: 'RedFort',                distance: 1.0, baseSpeed: 25, toll: 0, defaultDensity: 70 },
  { source: 'PatelNagar',             target: 'ChandniChowk',           distance: 2.0, baseSpeed: 45, toll: 5.50, defaultDensity: 15 }, // Toll road simulator
  { source: 'RajGhat',                target: 'RedFort',                distance: 1.3, baseSpeed: 30, toll: 0, defaultDensity: 55 },
  { source: 'RedFort',                target: 'ChandniChowk',           distance: 1.2, baseSpeed: 25, toll: 0, defaultDensity: 60 }
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
