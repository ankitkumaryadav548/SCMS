import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';
import SEO from '../components/SEO';
import { 
  NAVIGATION_NODES, 
  NAVIGATION_EDGES, 
  buildCustomEdges, 
  calculatePathStats, 
  findNearestNode,
  calculateEdgeSpeed,
  calculateEdgeTime
} from '../services/navigationData';
import { 
  Play, 
  Navigation, 
  Search, 
  MapPin, 
  Route, 
  Info, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  DollarSign, 
  RotateCcw, 
  Layers 
} from 'lucide-react';

// Custom Marker Icons using Tailwind CSS classes for high visual quality
const createMarkerIcon = (color, label) => {
  let colorClass = 'bg-brand-500';
  if (color === 'red') colorClass = 'bg-rose-500';
  if (color === 'emerald') colorClass = 'bg-emerald-500';
  
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center">
      <div class="absolute h-8 w-8 animate-ping rounded-full ${colorClass} opacity-20"></div>
      <div class="relative flex h-6 w-6 items-center justify-center rounded-full ${colorClass} border-2 border-white shadow-lg text-[10px] font-bold text-white uppercase">${label}</div>
    </div>`,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createIntersectionIcon = (isActive) => {
  return L.divIcon({
    html: `<div class="h-3.5 w-3.5 rounded-full border border-slate-800 shadow-md transition-all duration-200 ${
      isActive 
        ? 'bg-cyan-400 scale-125 ring-4 ring-cyan-500/20' 
        : 'bg-slate-500 hover:bg-cyan-300'
    }"></div>`,
    className: 'custom-leaflet-intersection',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Map controller to adjust view dynamically
const MapController = ({ center, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, bounds, map]);
  return null;
};

const NavigationPage = () => {
  // State variables
  const [startNode, setStartNode] = useState('ConnaughtPlace');
  const [endNode, setEndNode] = useState('ChandniChowk');
  const [startInputText, setStartInputText] = useState(NAVIGATION_NODES.ConnaughtPlace.name);
  const [endInputText, setEndInputText] = useState(NAVIGATION_NODES.ChandniChowk.name);
  const [customStartCoords, setCustomStartCoords] = useState(null);
  const [customEndCoords, setCustomEndCoords] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [useCustomStart, setUseCustomStart] = useState(false);
  const [useCustomEnd, setUseCustomEnd] = useState(false);

  const [routeMode, setRouteMode] = useState('fastest'); // shortest vs fastest
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0); // slider
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showAlternativeRoute, setShowAlternativeRoute] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchNode, setSelectedSearchNode] = useState(null);

  // Result routes
  const [primaryRoute, setPrimaryRoute] = useState(null); // { path: [], stats: {}, execTime }
  const [alternativeRoute, setAlternativeRoute] = useState(null); // { path: [], stats: {}, execTime }
  const [comparisonData, setComparisonData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocLoading, setCurrentLocLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const [mapCenter, setMapCenter] = useState([28.63, 77.22]);
  const [mapBounds, setMapBounds] = useState(null);

  // Sync inputs with state modifications (e.g. from map pin select or current location)
  useEffect(() => {
    if (NAVIGATION_NODES[startNode]) {
      setStartInputText(NAVIGATION_NODES[startNode].name);
    }
  }, [startNode]);

  useEffect(() => {
    if (NAVIGATION_NODES[endNode]) {
      setEndInputText(NAVIGATION_NODES[endNode].name);
    }
  }, [endNode]);

  // Resolve location input text to graph node keys
  const resolveNodeKey = async (inputText) => {
    if (!inputText) return null;
    
    // 1. Check if it matches a predefined landmark name exactly
    const matchedNode = Object.entries(NAVIGATION_NODES).find(
      ([key, val]) => val.name.toLowerCase() === inputText.trim().toLowerCase()
    );
    if (matchedNode) return { key: matchedNode[0], customCoords: null };
    
    // 2. Check if we already have the geocoded coordinates in our dynamic suggestions list
    const matchedStartSuggestion = startSuggestions.find(
      s => s.name.toLowerCase() === inputText.trim().toLowerCase()
    );
    if (matchedStartSuggestion) {
      const snappedNode = findNearestNode(matchedStartSuggestion.lat, matchedStartSuggestion.lng);
      if (snappedNode) {
        return {
          key: snappedNode,
          customCoords: { lat: matchedStartSuggestion.lat, lng: matchedStartSuggestion.lng, name: matchedStartSuggestion.name }
        };
      }
    }
    
    const matchedEndSuggestion = endSuggestions.find(
      s => s.name.toLowerCase() === inputText.trim().toLowerCase()
    );
    if (matchedEndSuggestion) {
      const snappedNode = findNearestNode(matchedEndSuggestion.lat, matchedEndSuggestion.lng);
      if (snappedNode) {
        return {
          key: snappedNode,
          customCoords: { lat: matchedEndSuggestion.lat, lng: matchedEndSuggestion.lng, name: matchedEndSuggestion.name }
        };
      }
    }
    
    // 3. Perform geocoding via OpenStreetMap Nominatim
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputText)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        // Find nearest graph node to snap
        const snappedNode = findNearestNode(latitude, longitude);
        
        if (snappedNode) {
          return {
            key: snappedNode,
            customCoords: { lat: latitude, lng: longitude, name: display_name }
          };
        }
      }
    } catch (err) {
      console.warn("Geocoding failed, falling back to substring match:", err);
    }
    
    // 4. Fallback: search for substring match in predefined nodes
    const fallbackNode = Object.entries(NAVIGATION_NODES).find(
      ([key, val]) => val.name.toLowerCase().includes(inputText.trim().toLowerCase())
    );
    if (fallbackNode) {
      return { key: fallbackNode[0], customCoords: null };
    }
    
    return null;
  };

  // Dynamic autocomplete suggestions for Start Input (debounced)
  useEffect(() => {
    if (!startInputText || startInputText.length < 3) {
      setStartSuggestions([]);
      return;
    }

    const isPredefined = Object.values(NAVIGATION_NODES).some(
      node => node.name.toLowerCase() === startInputText.trim().toLowerCase()
    );
    if (isPredefined) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(startInputText)}&format=json&limit=5&countrycodes=in`
        );
        const data = await response.json();
        if (data) {
          const suggestions = data.map(item => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          setStartSuggestions(suggestions);
        }
      } catch (err) {
        console.warn("Datalist fetching failed:", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [startInputText]);

  // Dynamic autocomplete suggestions for End Input (debounced)
  useEffect(() => {
    if (!endInputText || endInputText.length < 3) {
      setEndSuggestions([]);
      return;
    }

    const isPredefined = Object.values(NAVIGATION_NODES).some(
      node => node.name.toLowerCase() === endInputText.trim().toLowerCase()
    );
    if (isPredefined) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endInputText)}&format=json&limit=5&countrycodes=in`
        );
        const data = await response.json();
        if (data) {
          const suggestions = data.map(item => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          setEndSuggestions(suggestions);
        }
      } catch (err) {
        console.warn("Datalist fetching failed:", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [endInputText]);

  // Fetch search matches
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = Object.entries(NAVIGATION_NODES)
      .filter(([key, node]) => node.name.toLowerCase().includes(query))
      .map(([key, node]) => ({ key, ...node }));
    setSearchResults(matches);
  }, [searchQuery]);

  // Main Route calculation
  const calculateRoute = async () => {
    setLoading(true);
    setError('');
    setInfoMessage('');
    setPrimaryRoute(null);
    setAlternativeRoute(null);

    try {
      // 1. Resolve geocoded addresses
      const resolvedStart = await resolveNodeKey(startInputText);
      const resolvedEnd = await resolveNodeKey(endInputText);

      if (!resolvedStart || !resolvedEnd) {
        throw new Error('Could not find or resolve start or end location coordinates.');
      }

      if (resolvedStart.key === resolvedEnd.key) {
        throw new Error('Origin and destination resolved to the same intersection node.');
      }

      // Update state for visual output and markers
      setStartNode(resolvedStart.key);
      setEndNode(resolvedEnd.key);
      setCustomStartCoords(resolvedStart.customCoords);
      setCustomEndCoords(resolvedEnd.customCoords);

      const activeStartNode = resolvedStart.key;
      const activeEndNode = resolvedEnd.key;

      if (resolvedStart.customCoords) {
        setMapCenter([resolvedStart.customCoords.lat, resolvedStart.customCoords.lng]);
      }

      // 2. Build custom edges representation for Java engine
      const customEdges = buildCustomEdges(routeMode, trafficMultiplier);

      // 3. Call Java Engine via Node.js proxy API
      const primaryResponse = await API.post('/traffic/optimize-route', {
        startNode: activeStartNode,
        endNode: activeEndNode,
        customEdges
      });

      if (!primaryResponse.data.success) {
        throw new Error(primaryResponse.data.message || 'Routing calculation failed.');
      }

      const pData = primaryResponse.data.data;
      if (!pData.path || pData.path.length === 0) {
        throw new Error('No path found between selected intersections.');
      }

      const pStats = calculatePathStats(pData.path, trafficMultiplier);
      const computedPrimary = {
        path: pData.path,
        stats: pStats,
        execTime: pData.executionTime
      };
      setPrimaryRoute(computedPrimary);
      if (pData.comparison) {
        setComparisonData(pData.comparison);
      }

      // 4. Optional: Calculate alternative route (K-Shortest alternative using edge penalty)
      if (showAlternativeRoute) {
        // Find edges on the primary path and penalize them by multiplying weight by 2.5
        const mainPathSet = new Set();
        for (let i = 0; i < pData.path.length - 1; i++) {
          mainPathSet.add(`${pData.path[i]}-${pData.path[i+1]}`);
          mainPathSet.add(`${pData.path[i+1]}-${pData.path[i]}`);
        }

        const penalizedEdges = customEdges.map(edge => {
          const isMainEdge = mainPathSet.has(`${edge.source}-${edge.target}`);
          return {
            ...edge,
            weight: isMainEdge ? parseFloat((edge.weight * 2.5).toFixed(4)) : edge.weight
          };
        });

        // Call routing endpoint again for alternative route using penalized edges
        const altResponse = await API.post('/traffic/optimize-route', {
          startNode: activeStartNode,
          endNode: activeEndNode,
          customEdges: penalizedEdges
        });

        if (altResponse.data.success) {
          const aData = altResponse.data.data;
          // Only set alternative route if it is actually different from the primary
          if (aData.path && aData.path.length > 0 && JSON.stringify(aData.path) !== JSON.stringify(pData.path)) {
            const aStats = calculatePathStats(aData.path, trafficMultiplier);
            setAlternativeRoute({
              path: aData.path,
              stats: aStats,
              execTime: aData.executionTime
            });
          }
        }
      }

      // 5. Update map boundary to focus on path
      const coords = pData.path.map(n => [NAVIGATION_NODES[n].lat, NAVIGATION_NODES[n].lng]);
      if (resolvedStart.customCoords) {
        coords.push([resolvedStart.customCoords.lat, resolvedStart.customCoords.lng]);
      }
      if (resolvedEnd.customCoords) {
        coords.push([resolvedEnd.customCoords.lat, resolvedEnd.customCoords.lng]);
      }
      setMapBounds(coords);
      
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Could not connect to DSA Routing Engine. Ensure the Spring Boot service is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Find user geolocation and snap to nearest graph node
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setCurrentLocLoading(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const snappedNode = findNearestNode(latitude, longitude);
        
        if (snappedNode) {
          setStartNode(snappedNode);
          setMapCenter([NAVIGATION_NODES[snappedNode].lat, NAVIGATION_NODES[snappedNode].lng]);
          setMapBounds(null);
          setInfoMessage(`Snapped to nearest intersection: ${NAVIGATION_NODES[snappedNode].name}`);
        } else {
          setError('Could not locate a nearby city intersection.');
        }
        setCurrentLocLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed, mocking Delhi center coordinates...');
        // Mock fallback to Connaught Place
        const mockLat = 28.6304;
        const mockLng = 77.2177;
        const snappedNode = findNearestNode(mockLat, mockLng);
        setStartNode(snappedNode);
        setMapCenter([mockLat, mockLng]);
        setInfoMessage('Using simulated current location in New Delhi (Connaught Place).');
        setCurrentLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Click on a node marker on the map to set start/end
  const handleNodeClick = (nodeKey) => {
    setSelectedSearchNode(nodeKey);
    setMapCenter([NAVIGATION_NODES[nodeKey].lat, NAVIGATION_NODES[nodeKey].lng]);
  };

  // Reset routing session and map view
  const handleReset = () => {
    setPrimaryRoute(null);
    setAlternativeRoute(null);
    setComparisonData(null);
    setError('');
    setInfoMessage('Map view and route settings reset to defaults.');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSearchNode(null);
    setMapCenter([28.63, 77.22]);
    setMapBounds(null);
    setStartNode('ConnaughtPlace');
    setEndNode('ChandniChowk');
    setStartInputText(NAVIGATION_NODES.ConnaughtPlace.name);
    setEndInputText(NAVIGATION_NODES.ChandniChowk.name);
    setCustomStartCoords(null);
    setCustomEndCoords(null);
    setStartSuggestions([]);
    setEndSuggestions([]);
    setUseCustomStart(false);
    setUseCustomEnd(false);
    setRouteMode('fastest');
    setTrafficMultiplier(1.0);
    setShowTrafficLayer(true);
    setShowAlternativeRoute(true);
    setLoading(false);
  };

  // Dynamic colors for traffic congestion on map
  const getTrafficColor = (density) => {
    const d = density * trafficMultiplier;
    if (d < 35) return '#10b981'; // Green (Low Traffic)
    if (d < 70) return '#eab308'; // Yellow (Moderate Traffic)
    return '#ef4444'; // Red (Heavy Congestion)
  };

  // Compute polyline coordinate arrays
  const getRouteCoordinates = (nodeKeys) => {
    if (!nodeKeys) return [];
    return nodeKeys.map(key => [NAVIGATION_NODES[key].lat, NAVIGATION_NODES[key].lng]);
  };

  // Generate direction instructions
  const generateDirections = (route) => {
    if (!route || !route.path) return [];
    const steps = [];
    for (let i = 0; i < route.path.length - 1; i++) {
      const current = route.path[i];
      const next = route.path[i + 1];
      const edge = NAVIGATION_EDGES.find(
        e => (e.source === current && e.target === next) || (e.source === next && e.target === current)
      );
      
      const dist = edge ? edge.distance : 1.0;
      const base = edge ? edge.defaultDensity * trafficMultiplier : 50;
      const speed = edge ? calculateEdgeSpeed(edge.baseSpeed, base) : 25;
      const time = Math.round(calculateEdgeTime(dist, speed));

      steps.push({
        from: NAVIGATION_NODES[current].name,
        to: NAVIGATION_NODES[next].name,
        distance: dist,
        time,
        toll: edge?.toll || 0
      });
    }
    return steps;
  };

  return (
    <div className="space-y-6">
      <SEO title="Route Planner" description="Smart City pathfinder and Dijkstra routing map tool." />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Route className="h-8 w-8 text-brand-500" />
            Smart Transit Navigator
          </h1>
          <p className="text-darkbg-textMuted text-sm mt-1">
            Calculate shortest geographic or fastest traffic-aware routes powered by Spring Boot Dijkstra.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="bg-darkbg-card hover:bg-darkbg-border text-darkbg-textMuted hover:text-white px-3.5 py-2 rounded-lg text-sm border border-darkbg-border flex items-center gap-2 transition-all font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Map
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Navigation Control Panel (Left Column) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Controls Card */}
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <Navigation className="h-4 w-4 text-brand-500" />
                Route Planning Panel
              </h2>
              <span className="text-xxs font-semibold uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400">
                DSA Dijkstra
              </span>
            </div>

            {/* Geocoder / Search bar */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                Search Intersection
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type intersection (e.g. Times Square)..."
                  className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-darkbg-textMuted" />
              </div>

              {/* Autocomplete list */}
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 bg-darkbg-card border border-darkbg-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((node) => (
                    <button
                      key={node.key}
                      onClick={() => {
                        handleNodeClick(node.key);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-darkbg-border text-slate-300 hover:text-white border-b border-darkbg-border/40 last:border-none flex items-center justify-between"
                    >
                      <span>{node.name}</span>
                      <span className="text-xxs text-darkbg-textMuted font-mono">Select Node</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Route Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Origin selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5 flex items-center justify-between">
                    <span>Start Location</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomStart(!useCustomStart);
                        if (useCustomStart) setStartInputText(NAVIGATION_NODES[startNode]?.name || '');
                      }}
                      className="text-[10px] text-brand-400 hover:text-brand-300 underline font-normal cursor-pointer"
                    >
                      {useCustomStart ? "Select from list" : "Type custom..."}
                    </button>
                  </label>
                  {useCustomStart ? (
                    <input
                      type="text"
                      list="start-suggestions"
                      value={startInputText}
                      onChange={(e) => setStartInputText(e.target.value)}
                      placeholder="Type custom landmark or address..."
                      className="w-full bg-black border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  ) : (
                    <select
                      value={startNode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartNode(val);
                        setStartInputText(NAVIGATION_NODES[val].name);
                        setCustomStartCoords(null);
                      }}
                      className="w-full bg-black border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                    >
                      {Object.entries(NAVIGATION_NODES).map(([key, val]) => (
                        <option key={key} value={key} className="bg-darkbg-card text-white py-1">
                          📍 {val.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Destination selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5 flex items-center justify-between">
                    <span>End Location</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomEnd(!useCustomEnd);
                        if (useCustomEnd) setEndInputText(NAVIGATION_NODES[endNode]?.name || '');
                      }}
                      className="text-[10px] text-brand-400 hover:text-brand-300 underline font-normal cursor-pointer"
                    >
                      {useCustomEnd ? "Select from list" : "Type custom..."}
                    </button>
                  </label>
                  {useCustomEnd ? (
                    <input
                      type="text"
                      list="end-suggestions"
                      value={endInputText}
                      onChange={(e) => setEndInputText(e.target.value)}
                      placeholder="Type custom destination or address..."
                      className="w-full bg-black border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  ) : (
                    <select
                      value={endNode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEndNode(val);
                        setEndInputText(NAVIGATION_NODES[val].name);
                        setCustomEndCoords(null);
                      }}
                      className="w-full bg-black border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                    >
                      {Object.entries(NAVIGATION_NODES).map(([key, val]) => (
                        <option key={key} value={key} className="bg-darkbg-card text-white py-1">
                          🏁 {val.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

              </div>

              {/* Route Mode & Current Location Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Optimization Objective
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-darkbg-pure p-1 rounded-lg border border-darkbg-border">
                    <button
                      type="button"
                      onClick={() => setRouteMode('shortest')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                        routeMode === 'shortest' 
                          ? 'bg-brand-500 text-white shadow' 
                          : 'text-darkbg-textMuted hover:text-white'
                      }`}
                    >
                      Shortest Path
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouteMode('fastest')}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                        routeMode === 'fastest' 
                          ? 'bg-brand-500 text-white shadow' 
                          : 'text-darkbg-textMuted hover:text-white'
                      }`}
                    >
                      Fastest Path
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={currentLocLoading}
                  className="bg-darkbg-pure hover:bg-darkbg-border border border-darkbg-border text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto h-[38px] shrink-0"
                >
                  <MapPin className={`h-4 w-4 text-emerald-400 ${currentLocLoading ? 'animate-pulse' : ''}`} />
                  {currentLocLoading ? 'Locating...' : 'My Location'}
                </button>
              </div>

              {/* Congestion Control Slider */}
              <div className="bg-darkbg-pure p-4 rounded-lg border border-darkbg-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-darkbg-textMuted">Traffic Intensity Multiplier:</span>
                  <span className="font-bold text-brand-400">{trafficMultiplier.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2.5" 
                  step="0.1"
                  value={trafficMultiplier}
                  onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 bg-darkbg-border h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-darkbg-textMuted">
                  <span>Midnight / Empty (0.2x)</span>
                  <span>Normal</span>
                  <span>Rush Hour (2.5x)</span>
                </div>
              </div>

              {/* Layer Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showTrafficLayer} 
                    onChange={(e) => setShowTrafficLayer(e.target.checked)}
                    className="rounded bg-darkbg-pure border-darkbg-border text-brand-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Show Traffic Overlay</span>
                </label>
                
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showAlternativeRoute} 
                    onChange={(e) => setShowAlternativeRoute(e.target.checked)}
                    className="rounded bg-darkbg-pure border-darkbg-border text-brand-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Compute Alternative Path</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <button
                onClick={calculateRoute}
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting Spring Boot Engine...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Calculate Optimal Path
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-rose-400 text-xs flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Execution Error</h4>
                <p className="mt-0.5 opacity-90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-emerald-400 text-xs flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Route Statistics (Rendered when route exists) */}
          {primaryRoute && (
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-darkbg-border pb-2.5 flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-500" />
                Route Statistics & Comparison
              </h3>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Primary Route Statistics */}
                <div className="bg-darkbg-pure border border-darkbg-border rounded-lg p-3.5 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-brand-500 text-white text-[9px] font-bold rounded-bl uppercase">
                    Primary
                  </div>
                  <div className="text-xxs text-darkbg-textMuted font-bold uppercase">
                    {routeMode === 'fastest' ? 'Fastest Path' : 'Shortest Path'}
                  </div>
                  
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-darkbg-textMuted flex items-center gap-1"><Route className="h-3 w-3" /> Distance:</span>
                      <span className="font-bold text-white">{primaryRoute.stats.distance} km</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-darkbg-textMuted flex items-center gap-1"><Clock className="h-3 w-3" /> Est. Time:</span>
                      <span className="font-bold text-cyan-400">{primaryRoute.stats.time} mins</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-darkbg-textMuted flex items-center gap-1"><DollarSign className="h-3 w-3" /> Transit Cost:</span>
                      <span className="font-bold text-emerald-400">${primaryRoute.stats.cost}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-darkbg-border/60 pt-2 flex justify-between items-center text-[10px] text-darkbg-textMuted">
                    <span>Java Engine Latency:</span>
                    <span className="font-mono text-brand-400">{primaryRoute.execTime}</span>
                  </div>
                </div>

                {/* Alternative Route Statistics */}
                {alternativeRoute ? (
                  <div className="bg-darkbg-pure border border-purple-500/20 rounded-lg p-3.5 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-bl uppercase">
                      Alternative
                    </div>
                    <div className="text-xxs text-purple-400 font-bold uppercase">
                      Bypassing Main Routes
                    </div>
                    
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-darkbg-textMuted flex items-center gap-1"><Route className="h-3 w-3" /> Distance:</span>
                        <span className="font-bold text-white">{alternativeRoute.stats.distance} km</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-darkbg-textMuted flex items-center gap-1"><Clock className="h-3 w-3" /> Est. Time:</span>
                        <span className="font-bold text-purple-400">{alternativeRoute.stats.time} mins</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-darkbg-textMuted flex items-center gap-1"><DollarSign className="h-3 w-3" /> Transit Cost:</span>
                        <span className="font-bold text-emerald-400">${alternativeRoute.stats.cost}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-darkbg-border/60 pt-2 flex justify-between items-center text-[10px] text-darkbg-textMuted">
                      <span>Java Engine Latency:</span>
                      <span className="font-mono text-purple-400">{alternativeRoute.execTime}</span>
                    </div>
                  </div>
                ) : (
                  showAlternativeRoute && (
                    <div className="border border-dashed border-darkbg-border rounded-lg p-4 flex items-center justify-center text-center">
                      <span className="text-[11px] text-darkbg-textMuted">No distinct alternative path available for this graph config.</span>
                    </div>
                  )
                )}

              </div>

              {comparisonData && (
                <div className="border-t border-darkbg-border pt-4">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-3">
                    Algorithmic Performance Comparison (Spring Boot Engine Telemetry)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dijkstra Card */}
                    <div className="bg-darkbg-pure border border-darkbg-border rounded-xl p-4 space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Dijkstra's Algorithm</span>
                        <span className="text-[10px] bg-slate-800 text-darkbg-textMuted font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Uniform Search</span>
                      </div>
                      
                      <div className="space-y-1 text-xs pt-1">
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Execution Time:</span>
                          <span className="font-bold text-amber-400 font-mono">{comparisonData.dijkstra.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Nodes Visited:</span>
                          <span className="font-bold text-white font-mono">{comparisonData.dijkstra.nodesVisited} nodes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Time Complexity:</span>
                          <span className="font-bold text-slate-300 font-mono">O((V + E) log V)</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-[10px] text-darkbg-textMuted border-t border-darkbg-border/40 pt-2 leading-normal">
                        Dijkstra explores equal distance layers in all directions without target guidance.
                      </div>
                    </div>

                    {/* A* Card */}
                    <div className="bg-darkbg-pure border border-brand-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-400">A* Search (Heuristic)</span>
                        <span className="text-[10px] bg-brand-500/10 text-brand-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Heuristic Guided</span>
                      </div>
                      
                      <div className="space-y-1 text-xs pt-1">
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Execution Time:</span>
                          <span className="font-bold text-emerald-400 font-mono">{comparisonData.astar.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Nodes Visited:</span>
                          <span className="font-bold text-brand-400 font-mono">{comparisonData.astar.nodesVisited} nodes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-darkbg-textMuted">Time Complexity:</span>
                          <span className="font-bold text-slate-300 font-mono">O((V + E) log V) worst</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-[10px] text-darkbg-textMuted border-t border-darkbg-border/40 pt-2 leading-normal">
                        A* uses Euclidean distance to guide routing path directly towards target node.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Turn-by-Turn Directions list */}
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                  Navigation Instructions
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-darkbg-border rounded-lg p-2.5 bg-darkbg-pure">
                  {generateDirections(primaryRoute).map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs border-b border-darkbg-border/40 pb-2 last:border-none last:pb-0">
                      <div className="h-5 w-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold font-mono text-[10px]">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200">
                          Depart <strong className="text-white">{step.from}</strong> and head to <strong className="text-white">{step.to}</strong>.
                        </p>
                        <div className="flex gap-3 text-[10px] text-darkbg-textMuted mt-0.5">
                          <span>Distance: {step.distance} km</span>
                          <span>Est. Time: {step.time} mins</span>
                          {step.toll > 0 && <span className="text-yellow-500 font-semibold">Toll: ${step.toll.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Interactive Map Panel (Right Column) */}
        <div className="lg:col-span-7 flex flex-col relative h-[600px] lg:h-auto">
          
          {/* Selected Node Drawer overlay */}
          {selectedSearchNode && (
            <div className="absolute top-4 left-4 z-[1000] bg-darkbg-card/95 backdrop-blur border border-darkbg-border rounded-xl p-4 shadow-2xl max-w-sm">
              <h3 className="font-bold text-white text-sm">{NAVIGATION_NODES[selectedSearchNode].name}</h3>
              <p className="text-xxs text-darkbg-textMuted font-mono mt-0.5">
                Coords: [{NAVIGATION_NODES[selectedSearchNode].lat.toFixed(5)}, {NAVIGATION_NODES[selectedSearchNode].lng.toFixed(5)}]
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
                    setStartNode(selectedSearchNode);
                    setSelectedSearchNode(null);
                    setInfoMessage(`Start location set to: ${NAVIGATION_NODES[selectedSearchNode].name}`);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all text-center"
                >
                  Set as Start
                </button>
                <button
                  onClick={() => {
                    setEndNode(selectedSearchNode);
                    setSelectedSearchNode(null);
                    setInfoMessage(`Destination set to: ${NAVIGATION_NODES[selectedSearchNode].name}`);
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all text-center"
                >
                  Set as End
                </button>
              </div>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="h-full w-full rounded-2xl overflow-hidden border border-darkbg-border bg-darkbg-card shadow-2xl relative">
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <MapController center={mapCenter} bounds={mapBounds} />
              
              {/* Dark CartoDB Tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* Render street connections (Edges) with color-coded traffic weight */}
              {showTrafficLayer && NAVIGATION_EDGES.map((edge, index) => {
                const sourceNode = NAVIGATION_NODES[edge.source];
                const targetNode = NAVIGATION_NODES[edge.target];
                if (!sourceNode || !targetNode) return null;
                
                const pathCoords = [
                  [sourceNode.lat, sourceNode.lng],
                  [targetNode.lat, targetNode.lng]
                ];
                
                return (
                  <Polyline
                    key={`traffic-${index}`}
                    positions={pathCoords}
                    color={getTrafficColor(edge.defaultDensity)}
                    weight={3.5}
                    opacity={0.5}
                  >
                    <Popup>
                      <div className="text-slate-800 text-xs">
                        <strong>Street Segment</strong>
                        <p>{sourceNode.name} ⬌ {targetNode.name}</p>
                        <p>Distance: {edge.distance} km</p>
                        <p>Speed limit: {edge.baseSpeed} km/h</p>
                        <p>Current Congestion: {Math.round(edge.defaultDensity * trafficMultiplier)}%</p>
                        {edge.toll > 0 && <p className="text-yellow-600 font-semibold">Toll Road: ${edge.toll.toFixed(2)}</p>}
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}

              {/* Draw primary path in thick cyan polyline */}
              {primaryRoute && primaryRoute.path && (
                <Polyline
                  positions={getRouteCoordinates(primaryRoute.path)}
                  color="#22d3ee" // Cyan-400
                  weight={6.5}
                  opacity={0.9}
                  lineJoin="round"
                  lineCap="round"
                />
              )}

              {/* Draw alternative path in dashed purple polyline */}
              {alternativeRoute && alternativeRoute.path && (
                <Polyline
                  positions={getRouteCoordinates(alternativeRoute.path)}
                  color="#a78bfa" // Purple-400
                  weight={5}
                  opacity={0.7}
                  dashArray="8, 8"
                  lineJoin="round"
                  lineCap="round"
                />
              )}

              {/* Custom geocoded start pin */}
              {customStartCoords && (
                <>
                  <Marker 
                    position={[customStartCoords.lat, customStartCoords.lng]}
                    icon={createMarkerIcon('indigo', 'C')}
                  >
                    <Popup>
                      <div className="text-slate-800 text-xs font-semibold">
                        <strong>CUSTOM START ADDRESS</strong>
                        <p>{customStartCoords.name}</p>
                        <p className="text-[10px] text-slate-500">Snapped to: {NAVIGATION_NODES[startNode].name}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline 
                    positions={[
                      [customStartCoords.lat, customStartCoords.lng],
                      [NAVIGATION_NODES[startNode].lat, NAVIGATION_NODES[startNode].lng]
                    ]}
                    color="#6366f1"
                    weight={2.5}
                    dashArray="6, 6"
                  />
                </>
              )}

              {/* Custom geocoded end pin */}
              {customEndCoords && (
                <>
                  <Marker 
                    position={[customEndCoords.lat, customEndCoords.lng]}
                    icon={createMarkerIcon('rose', 'D')}
                  >
                    <Popup>
                      <div className="text-slate-800 text-xs font-semibold">
                        <strong>CUSTOM END ADDRESS</strong>
                        <p>{customEndCoords.name}</p>
                        <p className="text-[10px] text-slate-500">Snapped to: {NAVIGATION_NODES[endNode].name}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline 
                    positions={[
                      [customEndCoords.lat, customEndCoords.lng],
                      [NAVIGATION_NODES[endNode].lat, NAVIGATION_NODES[endNode].lng]
                    ]}
                    color="#f43f5e"
                    weight={2.5}
                    dashArray="6, 6"
                  />
                </>
              )}

              {/* Render intersection node pins */}
              {Object.entries(NAVIGATION_NODES).map(([key, val]) => {
                // Determine if this intersection is a start, end, or secondary highlight
                const isStart = startNode === key;
                const isEnd = endNode === key;
                const isAlternativePath = alternativeRoute?.path?.includes(key);
                const isPrimaryPath = primaryRoute?.path?.includes(key);
                
                if (isStart) {
                  return (
                    <Marker 
                      key={key} 
                      position={[val.lat, val.lng]}
                      icon={createMarkerIcon('emerald', 'S')}
                    >
                      <Popup>
                        <div className="text-slate-800 text-xs font-semibold">
                          <strong>START ORIGIN</strong>
                          <p>{val.name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }

                if (isEnd) {
                  return (
                    <Marker 
                      key={key} 
                      position={[val.lat, val.lng]}
                      icon={createMarkerIcon('red', 'E')}
                    >
                      <Popup>
                        <div className="text-slate-800 text-xs font-semibold">
                          <strong>END DESTINATION</strong>
                          <p>{val.name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }

                return (
                  <Marker
                    key={key}
                    position={[val.lat, val.lng]}
                    icon={createIntersectionIcon(isPrimaryPath || isAlternativePath)}
                    eventHandlers={{
                      click: () => handleNodeClick(key)
                    }}
                  >
                    <Popup>
                      <div className="text-slate-800 text-xs">
                        <strong className="font-semibold block">{val.name}</strong>
                        <span className="text-[10px] text-slate-500">Click to set as Start or End</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            </MapContainer>
          </div>
        </div>

      </div>

      {/* Info Warning Card */}
      <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-5 flex items-start gap-4">
        <Info className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
        <div className="text-xs text-darkbg-textMuted leading-relaxed space-y-1">
          <strong className="text-white block font-semibold">Under the Hood: Smart Routing Execution Details</strong>
          <p>
            When you request routing calculations:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1 font-medium">
            <li>The frontend builds a dynamic weighted edge schema of Manhattan intersections.</li>
            <li>In <span className="text-white font-semibold">Fastest Mode</span>, weights represent Travel Time in minutes (Time = (Distance / Speed) * 60), dynamically scaled by your congestion slider.</li>
            <li>This structured representation is posted via Axios to the Node.js API, which authenticates the call and relays the graph to the <span className="text-white font-semibold">Java Spring Boot Dijkstra API</span>.</li>
            <li>The Java engine loads the custom edges, computes the single-source shortest path using a binary heap priority queue Dijkstra implementation, and responds within milliseconds.</li>
            <li>The alternative path is resolved by adding a penalty weight (W * 2.5) to the primary path edges and querying the Java engine again to force a bypass routing path.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavigationPage;
