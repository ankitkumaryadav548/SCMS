import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSocket } from '../services/trafficSocket';
import SEO from '../components/SEO';
import {
  Play, Pause, Zap, AlertTriangle, Radio,
  Activity, Gauge, Car, Navigation, RefreshCw,
  Siren, Route, TrendingUp, Clock
} from 'lucide-react';

// ── Node coordinates (Delhi intersections) ───────────────────────────
const NODES = {
  TimesSquare:   { name: 'Connaught Place',          lat: 28.6304, lng: 77.2177 },
  CentralPark:   { name: 'India Gate',               lat: 28.6129, lng: 77.2295 },
  GrandCentral:  { name: 'New Delhi Rly Station',    lat: 28.6429, lng: 77.2217 },
  EmpireState:   { name: 'Rashtrapati Bhavan',       lat: 28.6143, lng: 77.2002 },
  UnionSquare:   { name: 'Karol Bagh',               lat: 28.6444, lng: 77.1903 },
  WashSquare:    { name: 'Rajendra Place',           lat: 28.6425, lng: 77.1780 },
  SoHo:          { name: 'Patel Nagar',              lat: 28.6450, lng: 77.1585 },
  WallStreet:    { name: 'Chandni Chowk',            lat: 28.6506, lng: 77.2303 },
  Chinatown:     { name: 'Red Fort',                 lat: 28.6562, lng: 77.2410 },
  EastVillage:   { name: 'Raj Ghat',                 lat: 28.6406, lng: 77.2495 },
  ChelseaMarket: { name: 'Lodhi Garden',             lat: 28.5933, lng: 77.2189 },
  HudsonYards:   { name: 'Safdarjung Tomb',          lat: 28.5893, lng: 77.2106 },
};

/** Get colour from density value */
const densityColor = (density) => {
  if (density >= 80) return '#ef4444'; // red – critical
  if (density >= 65) return '#f97316'; // orange – high
  if (density >= 45) return '#eab308'; // yellow – moderate
  return '#22c55e';                    // green – free-flow
};

const densityLabel = (density) => {
  if (density >= 80) return 'CRITICAL';
  if (density >= 65) return 'HIGH';
  if (density >= 45) return 'MODERATE';
  return 'FREE';
};

/** Clamp speed display */
const fmtSpeed = (s) => `${Math.round(s)} km/h`;

const MAX_LOG = 60;

const Traffic = () => {
  const socketRef = useRef(null);

  // ── Simulation state ──────────────────────────────────────────────
  const [simRunning,  setSimRunning]  = useState(true);
  const [simSpeed,    setSimSpeed]    = useState(1.0);
  const [edgeData,    setEdgeData]    = useState([]);          // live edges
  const [eventLog,    setEventLog]    = useState([]);          // rolling log
  const [alerts,      setAlerts]      = useState([]);          // active congestion alerts
  const [emergency,   setEmergency]   = useState(null);        // current emergency vehicle
  const [connected,   setConnected]   = useState(false);
  const [spawnLoading,setSpawnLoading]= useState(false);

  // ── Derived stats ──────────────────────────────────────────────────
  const avgDensity = edgeData.length
    ? Math.round(edgeData.reduce((s, e) => s + e.density, 0) / edgeData.length)
    : 0;
  const avgSpeed = edgeData.length
    ? Math.round(edgeData.reduce((s, e) => s + e.speed, 0) / edgeData.length)
    : 0;
  const congestedCount = edgeData.filter(e => e.density >= 65).length;

  // ── Add to event log ───────────────────────────────────────────────
  const pushLog = useCallback((type, msg, extra = {}) => {
    setEventLog(prev => [{
      id: Date.now() + Math.random(),
      type,      // 'info' | 'warn' | 'critical' | 'emergency' | 'alt'
      msg,
      time: new Date().toLocaleTimeString(),
      ...extra
    }, ...prev].slice(0, MAX_LOG));
  }, []);

  // ── Socket.io setup ────────────────────────────────────────────────
  useEffect(() => {
    const sock = getSocket();
    socketRef.current = sock;

    sock.on('connect',    () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));

    sock.on('traffic_update', ({ edges }) => {
      setEdgeData(edges);
    });

    sock.on('congestion_alert', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
      pushLog(
        data.severity === 'CRITICAL' ? 'critical' : 'warn',
        `Congestion ${data.severity} on ${data.edge} (${data.density}%)`,
        { density: data.density }
      );
    });

    sock.on('emergency_route', (data) => {
      setEmergency(data);
      pushLog('emergency', `🚑 ${data.vehicleId}: ${NODES[data.startNode]?.name} → ${NODES[data.endNode]?.name}`, data);
      if (data.alternativePath) {
        pushLog('alt', `↪ Alternative route computed for civilian traffic.`);
      }
      // Clear emergency display after 25 seconds
      setTimeout(() => setEmergency(prev => prev?.vehicleId === data.vehicleId ? null : prev), 25000);
    });

    sock.on('sim_state', ({ running }) => setSimRunning(running));

    setConnected(sock.connected);

    return () => {
      sock.off('traffic_update');
      sock.off('congestion_alert');
      sock.off('emergency_route');
      sock.off('sim_state');
      sock.off('connect');
      sock.off('disconnect');
    };
  }, [pushLog]);

  // ── Controls ───────────────────────────────────────────────────────
  const toggleSimulation = () => {
    const sock = socketRef.current;
    if (!sock) return;
    if (simRunning) {
      sock.emit('simulation_control', { action: 'stop' });
      setSimRunning(false);
      pushLog('info', 'Simulation paused.');
    } else {
      sock.emit('simulation_control', { action: 'start' });
      setSimRunning(true);
      pushLog('info', 'Simulation resumed.');
    }
  };

  const changeSpeed = (mult) => {
    socketRef.current?.emit('simulation_control', { action: 'speed', value: mult });
    setSimSpeed(mult);
    pushLog('info', `Simulation speed set to ${mult}x`);
  };

  const spawnEmergency = () => {
    setSpawnLoading(true);
    socketRef.current?.emit('simulation_control', { action: 'spawn_emergency' });
    setTimeout(() => setSpawnLoading(false), 2000);
  };

  // ── Map helpers ────────────────────────────────────────────────────
  const edgePolylines = edgeData.map((edge, i) => {
    const src = NODES[edge.source];
    const tgt = NODES[edge.target];
    if (!src || !tgt) return null;
    const color = densityColor(edge.density);
    const weight = edge.density >= 65 ? 5 : 3;
    return (
      <Polyline
        key={`${edge.source}-${edge.target}-${i}`}
        positions={[[src.lat, src.lng], [tgt.lat, tgt.lng]]}
        pathOptions={{ color, weight, opacity: 0.85 }}
      >
        <Tooltip sticky>
          <div className="text-xs">
            <strong>{src.name} → {tgt.name}</strong><br />
            Density: {edge.density}% &nbsp;|&nbsp; Speed: {fmtSpeed(edge.speed)}<br />
            Status: <span style={{ color }}>{densityLabel(edge.density)}</span>
          </div>
        </Tooltip>
      </Polyline>
    );
  });

  const emergencyPolyline = emergency?.path?.length > 1 ? (
    <Polyline
      positions={emergency.path.map(n => [NODES[n]?.lat, NODES[n]?.lng]).filter(Boolean)}
      pathOptions={{ color: '#3b82f6', weight: 5, dashArray: '10 6', opacity: 0.95 }}
    />
  ) : null;

  const altPolyline = emergency?.alternativePath?.length > 1 ? (
    <Polyline
      positions={emergency.alternativePath.map(n => [NODES[n]?.lat, NODES[n]?.lng]).filter(Boolean)}
      pathOptions={{ color: '#a855f7', weight: 4, dashArray: '6 8', opacity: 0.8 }}
    />
  ) : null;

  const nodeMarkers = Object.entries(NODES).map(([key, node]) => {
    const edge = edgeData.find(e => e.source === key || e.target === key);
    const density = edge ? edge.density : 0;
    const color = densityColor(density);
    const isEmergencyNode = emergency?.path?.includes(key);
    return (
      <CircleMarker
        key={key}
        center={[node.lat, node.lng]}
        radius={isEmergencyNode ? 10 : 7}
        pathOptions={{
          color: isEmergencyNode ? '#3b82f6' : color,
          fillColor: isEmergencyNode ? '#93c5fd' : color,
          fillOpacity: 0.85,
          weight: isEmergencyNode ? 3 : 1.5,
        }}
      >
        <Popup>
          <strong>{node.name}</strong><br />
          {edge ? `Density: ${edge.density}% | Speed: ${fmtSpeed(edge.speed)}` : 'No live data'}
        </Popup>
      </CircleMarker>
    );
  });

  // ── Log entry colours ──────────────────────────────────────────────
  const logColor = (type) => {
    if (type === 'critical')  return 'text-red-400 border-red-500/30 bg-red-500/5';
    if (type === 'warn')      return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    if (type === 'emergency') return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
    if (type === 'alt')       return 'text-purple-400 border-purple-500/30 bg-purple-500/5';
    return 'text-slate-400 border-slate-700/30 bg-slate-800/30';
  };

  return (
    <div className="space-y-6 pb-6">
      <SEO title="Traffic Optimizer" description="Smart City live traffic simulation, routing congestion metrics, and emergency priority path dispatch." />
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkbg-card border border-darkbg-border rounded-2xl p-6 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
              {connected ? 'Socket.io Live' : 'Disconnected'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Real-Time Traffic Simulation</h1>
          <p className="text-darkbg-textMuted text-xs mt-1 max-w-xl">
            Live city-wide traffic simulation with congestion detection, emergency vehicle priority routing & dynamic alternative paths.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-sm active:scale-95 ${
              simRunning
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
            }`}
          >
            {simRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {simRunning ? 'Pause Sim' : 'Resume Sim'}
          </button>

          {/* Speed */}
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                simSpeed === s
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-darkbg-pure border-darkbg-border text-darkbg-textMuted hover:border-brand-500 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}

          {/* Emergency */}
          <button
            onClick={spawnEmergency}
            disabled={spawnLoading}
            className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {spawnLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
            Spawn Emergency
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Congestion', value: `${avgDensity}%`, icon: Gauge,    color: densityColor(avgDensity), sub: densityLabel(avgDensity) },
          { label: 'Avg Speed',      value: fmtSpeed(avgSpeed), icon: Car,      color: '#14b8a6',           sub: 'City-wide' },
          { label: 'Congested Links',value: `${congestedCount}/${edgeData.length}`, icon: AlertTriangle, color: congestedCount > 5 ? '#ef4444' : '#f97316', sub: 'Links ≥65%' },
          { label: 'Active Alerts',  value: alerts.length,     icon: Radio,    color: '#8b5cf6',           sub: 'Last events' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20 pointer-events-none" style={{ backgroundColor: color }} />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-darkbg-textMuted">{label}</span>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white" style={{ color }}>{value}</div>
              <div className="text-[10px] text-darkbg-textMuted mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Map + Side Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Map */}
        <div className="lg:col-span-3 bg-darkbg-card border border-darkbg-border rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-darkbg-border">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-400" />
              Live City Network – Traffic Heatmap
            </h2>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              {[['#22c55e','FREE'],['#eab308','MODERATE'],['#f97316','HIGH'],['#ef4444','CRITICAL']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="h-2 w-4 rounded-sm inline-block" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: '480px' }}>
            <MapContainer
              center={[28.625, 77.21]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='© OpenStreetMap © CARTO'
              />
              {edgePolylines}
              {emergencyPolyline}
              {altPolyline}
              {nodeMarkers}
            </MapContainer>
          </div>
          {/* Map legend */}
          {emergency && (
            <div className="px-5 py-3 border-t border-darkbg-border flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span className="h-1 w-8 bg-blue-500 inline-block rounded-full" style={{ borderTop: '3px dashed #3b82f6', background: 'none' }} />
                <span className="text-blue-400 font-semibold">{emergency.vehicleId} route</span>
              </span>
              {emergency.alternativePath && (
                <span className="flex items-center gap-2">
                  <span className="h-0 w-8 inline-block border-t-2 border-dashed border-purple-500" />
                  <span className="text-purple-400 font-semibold">Alternative route</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">

          {/* Emergency vehicle card */}
          {emergency ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-blue-400 animate-pulse" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Emergency Active</span>
              </div>
              <div>
                <div className="text-lg font-extrabold text-white">{emergency.vehicleId}</div>
                <div className="text-xs text-blue-300 mt-0.5">
                  {NODES[emergency.startNode]?.name} → {NODES[emergency.endNode]?.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-darkbg-pure rounded-lg p-2">
                  <div className="text-[9px] text-darkbg-textMuted uppercase">Hops</div>
                  <div className="text-sm font-bold text-white">{emergency.path?.length || '—'}</div>
                </div>
                <div className="bg-darkbg-pure rounded-lg p-2">
                  <div className="text-[9px] text-darkbg-textMuted uppercase">Alt Route</div>
                  <div className="text-sm font-bold text-purple-400">{emergency.alternativePath ? 'Ready' : 'N/A'}</div>
                </div>
              </div>
              {emergency.alternativePath && (
                <div className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                  ↪ Civilian traffic rerouted via alternative path.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 text-center">
              <Siren className="h-8 w-8 text-darkbg-textMuted mx-auto mb-2 opacity-40" />
              <p className="text-xs text-darkbg-textMuted">No active emergency vehicle</p>
              <button
                onClick={spawnEmergency}
                disabled={spawnLoading}
                className="mt-3 w-full text-xs font-semibold text-blue-400 border border-blue-500/30 rounded-lg py-1.5 hover:bg-blue-500/10 transition-all disabled:opacity-50"
              >
                Spawn Now
              </button>
            </div>
          )}

          {/* Congestion alert list */}
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 border-b border-darkbg-border pb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Recent Alerts</span>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-[10px] text-darkbg-textMuted text-center py-4">No congestion events yet</p>
              ) : alerts.map((a, i) => (
                <div key={i} className={`rounded-lg p-2 border text-[10px] ${a.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5 text-red-300' : 'border-amber-500/30 bg-amber-500/5 text-amber-300'}`}>
                  <div className="font-bold">{a.severity}: {a.edge}</div>
                  <div className="opacity-80">{a.density}% density · {fmtSpeed(a.speed)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Event Log ── */}
      <div className="bg-darkbg-card border border-darkbg-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-brand-400" />
            Live Event Stream
          </h2>
          <button
            onClick={() => setEventLog([])}
            className="text-[10px] text-darkbg-textMuted hover:text-white transition-colors border border-darkbg-border px-2 py-1 rounded-lg"
          >
            Clear
          </button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono">
          {eventLog.length === 0 ? (
            <p className="text-[10px] text-darkbg-textMuted py-3 text-center">Waiting for events…</p>
          ) : eventLog.map(entry => (
            <div key={entry.id} className={`flex items-start gap-2 text-[11px] px-3 py-1.5 rounded-lg border ${logColor(entry.type)}`}>
              <span className="opacity-60 shrink-0 text-[10px] mt-px">{entry.time}</span>
              <span>{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Traffic;
