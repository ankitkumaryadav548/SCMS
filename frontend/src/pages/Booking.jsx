import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import {
  CalendarCheck, ParkingSquare, Wrench, Users, Clock,
  CheckCircle, XCircle, Ban, RefreshCw, ChevronRight,
  AlertCircle, TrendingUp, List, Car, Zap, Droplets,
  Trash2, Shield, MapPin, Hash, BarChart3
} from 'lucide-react';

// ── Status badge ────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Pending:   'bg-amber-500/15  text-amber-400  border border-amber-500/30',
    Approved:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Rejected:  'bg-red-500/15    text-red-400    border border-red-500/30',
    Cancelled: 'bg-slate-500/15  text-slate-400  border border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || ''}`}>
      {status === 'Pending'   && <Clock className="h-3 w-3" />}
      {status === 'Approved'  && <CheckCircle className="h-3 w-3" />}
      {status === 'Rejected'  && <XCircle className="h-3 w-3" />}
      {status === 'Cancelled' && <Ban className="h-3 w-3" />}
      {status}
    </span>
  );
};

// ── Type badge ──────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const map = {
    'Parking':       { color: 'bg-blue-500/15 text-blue-400',   Icon: ParkingSquare },
    'City Service':  { color: 'bg-violet-500/15 text-violet-400', Icon: Wrench },
    'Waiting Queue': { color: 'bg-cyan-500/15 text-cyan-400',   Icon: Users },
  };
  const { color, Icon } = map[type] || { color: 'bg-slate-500/15 text-slate-400', Icon: List };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="h-3 w-3" /> {type}
    </span>
  );
};

// ── Stat card ───────────────────────────────────────────
const StatCard = ({ label, value, Icon, color }) => (
  <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-xs text-darkbg-textMuted font-medium">{label}</p>
    </div>
  </div>
);

// ── City services list ──────────────────────────────────
const CITY_SERVICES = [
  { id: 'water-supply',    name: 'Water Supply Request',    icon: Droplets },
  { id: 'waste-pickup',    name: 'Waste Pickup Scheduling', icon: Trash2   },
  { id: 'electricity',     name: 'Electricity Complaint',   icon: Zap      },
  { id: 'road-repair',     name: 'Road Repair Request',     icon: Wrench   },
  { id: 'public-safety',   name: 'Public Safety Concern',   icon: Shield   },
];

// ════════════════════════════════════════════════════════
const BookingPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // ── Shared state ──────────────────────────────────────
  const [bookings,     setBookings]     = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [formLoading,  setFormLoading]  = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [activeTab,    setActiveTab]    = useState(isAdmin ? 'queue' : 'parking');

  // ── Form state ────────────────────────────────────────
  const [selectedSlot,    setSelectedSlot]    = useState('');
  const [vehicleNumber,   setVehicleNumber]   = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [scheduleDate,    setScheduleDate]    = useState('');
  const [serviceNotes,    setServiceNotes]    = useState('');
  const [queueNotes,      setQueueNotes]      = useState('');
  const [queueTitle,      setQueueTitle]      = useState('');

  // ── Load data ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bRes, sRes] = await Promise.all([
        API.get('/bookings'),
        API.get('/bookings/parking-slots')
      ]);
      setBookings(bRes.data.data || []);
      setParkingSlots(sRes.data.data || []);

      if (isAdmin) {
        const [qRes, stRes] = await Promise.all([
          API.get('/bookings/queue'),
          API.get('/bookings/stats')
        ]);
        setQueue(qRes.data.data || []);
        setStats(stRes.data.data || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const notify = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // ── Actions ───────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.patch(`/bookings/${id}/cancel`);
      notify('Booking cancelled.');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Cancel failed.', true); }
  };

  const handleApprove = async (id) => {
    try {
      await API.patch(`/bookings/${id}/approve`);
      notify('Booking approved.');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Approve failed.', true); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this booking?')) return;
    try {
      await API.patch(`/bookings/${id}/reject`);
      notify('Booking rejected.');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Reject failed.', true); }
  };

  // ── Citizen booking forms ─────────────────────────────
  const bookParking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return notify('Please select a parking slot.', true);
    if (!vehicleNumber.trim()) return notify('Please enter your vehicle number.', true);
    setFormLoading(true);
    try {
      const slot = parkingSlots.find(s => s._id === selectedSlot);
      await API.post('/bookings', {
        type: 'Parking',
        serviceDetails: {
          name:          slot.slotNumber,
          location:      slot.location,
          vehicleNumber: vehicleNumber.toUpperCase(),
          slotId:        selectedSlot
        }
      });
      notify('Parking booked! Awaiting admin approval.');
      setSelectedSlot(''); setVehicleNumber('');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Booking failed.', true); }
    finally { setFormLoading(false); }
  };

  const bookService = async (e) => {
    e.preventDefault();
    if (!selectedService) return notify('Please select a service.', true);
    setFormLoading(true);
    try {
      const svc = CITY_SERVICES.find(s => s.id === selectedService);
      await API.post('/bookings', {
        type: 'City Service',
        serviceDetails: {
          name:          svc.name,
          scheduledDate: scheduleDate || null,
          notes:         serviceNotes
        }
      });
      notify('Service request submitted! Awaiting approval.');
      setSelectedService(''); setScheduleDate(''); setServiceNotes('');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Booking failed.', true); }
    finally { setFormLoading(false); }
  };

  const joinQueue = async (e) => {
    e.preventDefault();
    if (!queueTitle.trim()) return notify('Please describe your request.', true);
    setFormLoading(true);
    try {
      await API.post('/bookings', {
        type: 'Waiting Queue',
        serviceDetails: { name: queueTitle, notes: queueNotes }
      });
      notify('You have been added to the waiting queue!');
      setQueueTitle(''); setQueueNotes('');
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || 'Could not join queue.', true); }
    finally { setFormLoading(false); }
  };

  // ── Derived helpers ───────────────────────────────────
  const availableSlots = parkingSlots.filter(s => s.status === 'Available');
  const myBookings = bookings;

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <SEO title="Resource Bookings" description="Smart City parking slot and utility service waiting queue reservations." />
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-500" />
            Booking Management
          </h1>
          <p className="text-darkbg-textMuted text-sm mt-1">
            {isAdmin
              ? 'Monitor queue, approve/reject bookings, and manage city resources.'
              : 'Book parking, city services, or join the waiting queue.'}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-darkbg-card border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error   && <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

      {/* ── ADMIN VIEW ─────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Queue Length"      value={stats.queueSize}      Icon={List}         color="bg-cyan-500/15 text-cyan-400" />
              <StatCard label="Pending Bookings"  value={stats.pending}        Icon={Clock}        color="bg-amber-500/15 text-amber-400" />
              <StatCard label="Approved Today"    value={stats.approvedToday}  Icon={CheckCircle}  color="bg-emerald-500/15 text-emerald-400" />
              <StatCard label="Available Parking" value={stats.availableSlots} Icon={ParkingSquare} color="bg-blue-500/15 text-blue-400" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-darkbg-border">
            {[
              { id: 'queue',    label: 'Live Queue',     Icon: List        },
              { id: 'all',      label: 'All Bookings',   Icon: BarChart3   },
              { id: 'parking',  label: 'Parking Slots',  Icon: ParkingSquare },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                  activeTab === id
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-darkbg-textMuted hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {/* Live Queue Panel */}
          {activeTab === 'queue' && (
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-darkbg-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" /> Waiting Queue
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold">{queue.length}</span>
                </h2>
                <p className="text-xs text-darkbg-textMuted">FIFO order · First in, first approved</p>
              </div>
              {queue.length === 0 ? (
                <div className="text-center py-12 text-darkbg-textMuted text-sm">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Queue is empty — no pending bookings.
                </div>
              ) : (
                <div className="divide-y divide-darkbg-border">
                  {queue.map((b, idx) => (
                    <div key={b._id} className="px-5 py-4 flex items-center gap-4 hover:bg-darkbg-border/20 transition-all">
                      {/* Position badge */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-darkbg-border text-darkbg-textMuted'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{b.userName}</p>
                        <p className="text-xs text-darkbg-textMuted">{b.userEmail}</p>
                      </div>
                      <TypeBadge type={b.type} />
                      <div className="text-right hidden sm:block min-w-0">
                        <p className="text-sm text-white font-medium truncate max-w-[150px]">{b.serviceDetails?.name}</p>
                        <p className="text-xs text-darkbg-textMuted">{new Date(b.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(b._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg transition-all border border-emerald-500/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(b._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-all border border-red-500/20"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Bookings Table */}
          {activeTab === 'all' && (
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-darkbg-border">
                <h2 className="text-sm font-bold text-white">All Bookings ({bookings.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-darkbg-border text-left">
                      {['Citizen', 'Type', 'Service', 'Status', 'Queue#', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkbg-border">
                    {bookings.map(b => (
                      <tr key={b._id} className="hover:bg-darkbg-border/20 transition-all">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{b.userName}</p>
                          <p className="text-xs text-darkbg-textMuted">{b.userEmail}</p>
                        </td>
                        <td className="px-4 py-3"><TypeBadge type={b.type} /></td>
                        <td className="px-4 py-3 text-darkbg-textMuted max-w-[150px] truncate">{b.serviceDetails?.name}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3 text-center">
                          {b.queuePosition
                            ? <span className="font-bold text-cyan-400">#{b.queuePosition}</span>
                            : <span className="text-darkbg-textMuted">—</span>}
                        </td>
                        <td className="px-4 py-3 text-darkbg-textMuted text-xs">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          {b.status === 'Pending' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleApprove(b._id)} className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-all" title="Approve"><CheckCircle className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleReject(b._id)}  className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 transition-all" title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.length === 0 && (
                  <div className="text-center py-12 text-darkbg-textMuted text-sm">No bookings found.</div>
                )}
              </div>
            </div>
          )}

          {/* Parking Slots Grid */}
          {activeTab === 'parking' && (
            <div className="space-y-4">
              {['A','B','C','D'].map(zone => {
                const zoneSlots = parkingSlots.filter(s => s.zone === zone);
                if (!zoneSlots.length) return null;
                return (
                  <div key={zone} className="bg-darkbg-card border border-darkbg-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-darkbg-border">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-500" />
                        Zone {zone} — {zoneSlots[0]?.location}
                        <span className="ml-auto text-xs text-darkbg-textMuted">
                          {zoneSlots.filter(s => s.status === 'Available').length} / {zoneSlots.length} Available
                        </span>
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-5 gap-2">
                      {zoneSlots.map(s => (
                        <div key={s._id} className={`rounded-lg p-3 text-center border transition-all ${
                          s.status === 'Available'  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          s.status === 'Reserved'   ? 'bg-amber-500/10  border-amber-500/30  text-amber-400'  :
                                                      'bg-red-500/10    border-red-500/30    text-red-400'
                        }`}>
                          <Car className="h-4 w-4 mx-auto mb-1" />
                          <p className="text-xs font-bold">{s.slotNumber}</p>
                          <p className="text-[10px] opacity-70">{s.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CITIZEN VIEW ───────────────────────────────── */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: forms */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tab selector */}
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-1 flex gap-1">
              {[
                { id: 'parking', label: 'Parking',     Icon: ParkingSquare },
                { id: 'service', label: 'City Service', Icon: Wrench        },
                { id: 'queue',   label: 'Join Queue',   Icon: Users         },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === id
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-darkbg-textMuted hover:text-white hover:bg-darkbg-border/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* ── BOOK PARKING FORM ─────────────────────── */}
            {activeTab === 'parking' && (
              <form onSubmit={bookParking} className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ParkingSquare className="h-4 w-4 text-blue-400" /> Book Parking Slot
                </h2>

                {/* Slot grid */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-3">
                    Select Slot — {availableSlots.length} Available
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                      <XCircle className="h-4 w-4 shrink-0" />
                      No parking slots available right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {availableSlots.map(s => {
                        const isSelected = selectedSlot === s._id;
                        return (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => setSelectedSlot(isSelected ? '' : s._id)}
                            className={`relative rounded-xl p-3 text-left border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-brand-500 bg-brand-500/15 shadow-lg shadow-brand-500/20 scale-[1.02]'
                                : 'border-darkbg-border bg-darkbg-pure hover:border-brand-500/50 hover:bg-brand-500/5'
                            }`}
                          >
                            {/* Checkmark */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                            <Car className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-brand-400' : 'text-darkbg-textMuted'}`} />
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-darkbg-textMuted'}`}>
                              {s.slotNumber}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-brand-300' : 'text-darkbg-textMuted/60'}`}>
                              {s.location}
                            </p>
                            <p className="text-[10px] font-semibold text-brand-400 mt-1">₹{s.pricePerHour}/hr</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected slot preview */}
                {selectedSlot && (() => {
                  const slot = parkingSlots.find(s => s._id === selectedSlot);
                  return slot ? (
                    <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-3">
                      <ParkingSquare className="h-5 w-5 text-brand-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">Slot {slot.slotNumber} selected</p>
                        <p className="text-xs text-brand-300">{slot.location} · ₹{slot.pricePerHour}/hr</p>
                      </div>
                      <button type="button" onClick={() => setSelectedSlot('')} className="text-darkbg-textMuted hover:text-white">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Vehicle number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    placeholder="e.g. DL 01 AB 1234"
                    className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors uppercase placeholder:normal-case"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading || availableSlots.length === 0 || !selectedSlot || !vehicleNumber.trim()}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  {formLoading
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Processing…</>
                    : <><CheckCircle className="h-4 w-4" /> Confirm Parking Booking</>}
                </button>
              </form>
            )}

            {/* ── BOOK CITY SERVICE FORM ───────────────── */}
            {activeTab === 'service' && (
              <form onSubmit={bookService} className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-violet-400" /> Request City Service
                </h2>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-2">
                    Select Service *
                  </label>
                  {CITY_SERVICES.map(svc => {
                    const Icon = svc.icon;
                    const isSelected = selectedService === svc.id;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setSelectedService(isSelected ? '' : svc.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-all duration-200 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/15 shadow-md shadow-violet-500/10'
                            : 'border-darkbg-border bg-darkbg-pure hover:border-violet-500/40 hover:bg-violet-500/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-violet-500 text-white' : 'bg-darkbg-border text-darkbg-textMuted'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`flex-1 text-left font-medium ${isSelected ? 'text-white' : 'text-darkbg-textMuted'}`}>
                          {svc.name}
                        </span>
                        {isSelected && <CheckCircle className="h-4 w-4 text-violet-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Preferred Date <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Notes <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={serviceNotes}
                    onChange={e => setServiceNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the issue or request in detail..."
                    className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  />
                  <p className="text-xs text-darkbg-textMuted mt-1 text-right">{serviceNotes.length} chars</p>
                </div>

                <button
                  type="submit"
                  disabled={formLoading || !selectedService}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  {formLoading
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <><ChevronRight className="h-4 w-4" /> Submit Service Request</>}
                </button>
              </form>
            )}

            {/* ── JOIN QUEUE FORM ──────────────────────── */}
            {activeTab === 'queue' && (
              <form onSubmit={joinQueue} className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 space-y-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" /> Join Waiting Queue
                </h2>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-cyan-300 flex items-start gap-2">
                  <Hash className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-400" />
                  <span>
                    Your request is added to a <strong className="text-cyan-200">FIFO queue</strong>.
                    Admin processes requests in order — first in, first served.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    value={queueTitle}
                    onChange={e => setQueueTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Water supply issue in Block C"
                    className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-darkbg-textMuted mt-1 text-right">{queueTitle.length}/100</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5">
                    Details <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={queueNotes}
                    onChange={e => setQueueNotes(e.target.value)}
                    rows={4}
                    placeholder="Provide additional context, location, or urgency..."
                    className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                  <p className="text-xs text-darkbg-textMuted mt-1 text-right">{queueNotes.length} chars</p>
                </div>

                {/* Preview box */}
                {queueTitle.trim() && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Preview</p>
                    <p className="text-sm text-white font-medium">{queueTitle}</p>
                    {queueNotes && <p className="text-xs text-darkbg-textMuted">{queueNotes}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading || !queueTitle.trim()}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {formLoading
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Joining Queue…</>
                    : <><Users className="h-4 w-4" /> Join Queue</>}
                </button>
              </form>
            )}
          </div>

          {/* Right: My Bookings */}

          <div className="lg:col-span-7">
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-darkbg-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-500" /> My Bookings
                </h2>
                <span className="text-xs text-darkbg-textMuted">{myBookings.length} total</span>
              </div>
              {loading ? (
                <div className="py-12 text-center text-darkbg-textMuted text-sm">Loading…</div>
              ) : myBookings.length === 0 ? (
                <div className="py-12 text-center text-darkbg-textMuted text-sm">
                  <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  No bookings yet. Use the form to get started.
                </div>
              ) : (
                <div className="divide-y divide-darkbg-border">
                  {myBookings.map(b => (
                    <div key={b._id} className="px-5 py-4 hover:bg-darkbg-border/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <TypeBadge type={b.type} />
                            <StatusBadge status={b.status} />
                            {b.queuePosition && (
                              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                                <Hash className="h-3 w-3" />Queue #{b.queuePosition}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-white">{b.serviceDetails?.name}</p>
                          {b.serviceDetails?.location && (
                            <p className="text-xs text-darkbg-textMuted flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{b.serviceDetails.location}
                            </p>
                          )}
                          {b.serviceDetails?.vehicleNumber && (
                            <p className="text-xs text-darkbg-textMuted flex items-center gap-1 mt-0.5">
                              <Car className="h-3 w-3" />{b.serviceDetails.vehicleNumber}
                            </p>
                          )}
                          {b.adminNote && (
                            <p className="text-xs text-amber-400 mt-1 bg-amber-500/10 rounded px-2 py-1">
                              Admin: {b.adminNote}
                            </p>
                          )}
                          <p className="text-xs text-darkbg-textMuted mt-1">
                            {new Date(b.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                        {(b.status === 'Pending' || b.status === 'Approved') && (
                          <button
                            onClick={() => handleCancel(b._id)}
                            className="shrink-0 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Ban className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-5 flex items-start gap-4">
        <Hash className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
        <div className="text-xs text-darkbg-textMuted leading-relaxed">
          <strong className="text-white block font-semibold mb-1">Under the Hood: Queue Data Structure</strong>
          The waiting queue is implemented as a FIFO (First In, First Out) array-backed queue in the Node.js backend.
          Every new booking is <span className="text-white font-semibold">enqueued</span> with an O(1) push.
          Approvals and rejections <span className="text-white font-semibold">dequeue</span> via array shift (O(n)) and
          automatically recalculate position numbers for remaining items.
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
