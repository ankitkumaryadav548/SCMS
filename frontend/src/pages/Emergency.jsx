import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { InlineLoader } from '../components/LoadingScreen';
import {
  AlertOctagon, Flame, ShieldAlert, HeartHandshake, Eye, Plus, X,
  MapPin, Clock, CheckCircle, RefreshCw, AlertTriangle, AlertCircle,
  Activity, Users
} from 'lucide-react';

const INCIDENT_TYPES = ['Fire', 'Accident', 'Flood', 'Power Outage', 'Medical'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const INCIDENT_STATUSES = ['Reported', 'Dispatched', 'Resolved', 'Closed'];

const Emergency = () => {
  const { showToast } = useToast();
  
  // ── States ─────────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [statusLoadingMap, setStatusLoadingMap] = useState({});

  // ── Form State ─────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Fire');
  const [severity, setSeverity] = useState('Medium');
  const [lat, setLat] = useState('28.6129');
  const [lng, setLng] = useState('77.2295');

  // ── Load data from REST API ────────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/emergency/incidents');
      if (response.data?.success) {
        setIncidents(response.data.data || []);
      } else {
        setError(response.data?.message || 'Failed to retrieve incidents.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Database offline. Make sure the Node server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // ── Manage Incident Status ─────────────────────────────────────────
  const handleUpdateStatus = async (id, nextStatus) => {
    setStatusLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      const response = await API.patch(`/emergency/incidents/${id}/status`, { status: nextStatus });
      if (response.data?.success) {
        showToast(`Incident status updated to ${nextStatus}.`, 'success');
        setIncidents(prev => prev.map(inc => inc._id === id ? { ...inc, status: nextStatus } : inc));
      } else {
        showToast(response.data?.message || 'Status update failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setStatusLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  // ── Report New Incident ────────────────────────────────────────────
  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!title.trim() || !lat.trim() || !lng.trim()) {
      showToast('Title and location coordinates are required.', 'warning');
      return;
    }
    
    setSubmitLoading(true);
    try {
      const payload = {
        title,
        description,
        type,
        severity,
        location_lat: parseFloat(lat),
        location_lng: parseFloat(lng)
      };
      
      const response = await API.post('/emergency/incidents', payload);
      if (response.data?.success) {
        showToast('Incident reported and dispatched to operators.', 'success');
        setShowModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setType('Fire');
        setSeverity('Medium');
        setLat('28.6129');
        setLng('77.2295');
        fetchIncidents();
      } else {
        showToast(response.data?.message || 'Failed to report incident.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to report incident.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── UI Styles ──────────────────────────────────────────────────────
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Low':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Closed':
      case 'Resolved': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Dispatched': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'Reported':
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  const inputCls = 'w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-darkbg-textMuted/50';
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5';

  return (
    <div className="space-y-8 pb-10">
      <SEO title="Emergency Incidents" description="Smart City emergency report and priority dispatch operations management console." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkbg-card border border-darkbg-border rounded-2xl p-6 shadow-glass relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="h-7 w-7 text-rose-500" />
            Emergency Incident Dispatch
          </h1>
          <p className="text-darkbg-textMuted text-xs mt-1 max-w-xl">
            Monitor active hazards, assign responders, and track dispatch status in real-time across New Delhi Central Grid.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={fetchIncidents}
            className="p-2 border border-darkbg-border hover:border-brand-500 text-darkbg-textMuted hover:text-white rounded-lg transition-all"
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
          >
            <Plus className="h-4 w-4" />
            File Incident Report
          </button>
        </div>
      </div>

      {/* Main logs display */}
      <div className="bg-darkbg-card border border-darkbg-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-darkbg-border">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Incident Registry</h2>
        </div>

        {error && (
          <div className="m-6 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Failed to load active reports</h4>
              <p className="mt-1 text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <InlineLoader message="Loading active dispatch logs..." />
        ) : incidents.length === 0 ? (
          <div className="text-center py-16 text-darkbg-textMuted text-sm">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500 animate-pulse" />
            <p className="font-semibold text-white">No active incidents registered</p>
            <p className="text-xs mt-1 text-darkbg-textMuted">Smart City grid is operating under standard safety parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-darkbg-pure border-b border-darkbg-border text-[10px] text-darkbg-textMuted uppercase font-semibold">
                  <th className="px-6 py-4">Incident Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location Coordinates</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkbg-border text-sm">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-darkbg-pure/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white block">{inc.title}</span>
                      <span className="text-xs text-darkbg-textMuted mt-0.5 block max-w-sm truncate">{inc.description || 'No description provided.'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-white/90">
                        {inc.type === 'Fire' && <Flame className="h-4 w-4 text-rose-400" />}
                        {inc.type === 'Flood' && <Eye className="h-4 w-4 text-blue-400" />}
                        {inc.type === 'Accident' && <ShieldAlert className="h-4 w-4 text-amber-400" />}
                        {inc.type === 'Medical' && <HeartHandshake className="h-4 w-4 text-emerald-400" />}
                        {inc.type === 'Power Outage' && <Activity className="h-4 w-4 text-violet-400" />}
                        <span className="font-medium">{inc.type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityStyle(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(inc.status)}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-darkbg-textMuted">
                      {inc.location_lat.toFixed(6)}, {inc.location_lng.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inc.status === 'Reported' && (
                          <button
                            onClick={() => handleUpdateStatus(inc._id, 'Dispatched')}
                            disabled={statusLoadingMap[inc._id]}
                            className="bg-amber-600/15 border border-amber-600/30 text-amber-400 hover:bg-amber-600/25 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Dispatch Unit
                          </button>
                        )}
                        {(inc.status === 'Dispatched' || inc.status === 'Reported') && (
                          <button
                            onClick={() => handleUpdateStatus(inc._id, 'Resolved')}
                            disabled={statusLoadingMap[inc._id]}
                            className="bg-emerald-600/15 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/25 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {inc.status === 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(inc._id, 'Closed')}
                            disabled={statusLoadingMap[inc._id]}
                            className="bg-slate-700 border border-slate-600 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Archive
                          </button>
                        )}
                        {inc.status === 'Closed' && (
                          <span className="text-xs text-darkbg-textMuted italic font-medium px-2.5 py-1.5 inline-block">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── File Report Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-darkbg-card border border-darkbg-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-4 border-b border-darkbg-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white">File New Incident Report</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Incident Title *</label>
                <input
                  className={inputCls}
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Substation fire or Water pipe leakage"
                />
              </div>

              <div>
                <label className={labelCls}>Detailed Description</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide parameters, immediate risks, or general context..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Incident Type</label>
                  <select
                    className={selectCls}
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    {INCIDENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Severity</label>
                  <select
                    className={selectCls}
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                  >
                    {SEVERITIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Latitude *</label>
                  <input
                    className={inputCls}
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Longitude *</label>
                  <input
                    className={inputCls}
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-darkbg-border rounded-xl text-sm font-semibold text-darkbg-textMuted hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {submitLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Dispatch Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emergency;
