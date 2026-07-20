import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import {
  Users, Plus, Search, Filter, SortAsc, SortDesc, Edit3, Trash2,
  Eye, Clock, RefreshCw, ChevronLeft, ChevronRight, X, CheckCircle,
  AlertCircle, Download, Upload, BarChart3, Hash, MapPin, Phone,
  Mail, Calendar, User, Shield, Activity, List
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const WARDS      = ['Ward A','Ward B','Ward C','Ward D','Ward E','Ward F','Ward G','Ward H'];
const CATEGORIES = ['General','OBC','SC','ST','EWS'];
const STATUSES   = ['Active','Inactive','Deceased','Migrated'];
const GENDERS    = ['Male','Female','Other'];
const SORT_OPTS  = [
  { value: 'created_at', label: 'Date Registered' },
  { value: 'name',       label: 'Name' },
  { value: 'citizenId',  label: 'Citizen ID' },
];

// ═══════════════════════════════════════════════════════════
// SMALL HELPERS
// ═══════════════════════════════════════════════════════════
const statusColor = s => ({
  Active:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Inactive: 'bg-slate-500/15  text-slate-400  border-slate-500/30',
  Deceased: 'bg-red-500/15    text-red-400    border-red-500/30',
  Migrated: 'bg-amber-500/15  text-amber-400  border-amber-500/30',
}[s] || 'bg-slate-500/15 text-slate-400');

const catColor = c => ({
  General: 'bg-blue-500/15  text-blue-400',
  OBC:     'bg-purple-500/15 text-purple-400',
  SC:      'bg-orange-500/15 text-orange-400',
  ST:      'bg-teal-500/15  text-teal-400',
  EWS:     'bg-rose-500/15  text-rose-400',
}[c] || 'bg-slate-500/15 text-slate-400');

const Chip = ({ children, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${className}`}>
    {children}
  </span>
);

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const age = d => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' yrs';
};

// ═══════════════════════════════════════════════════════════
// MODAL — Add / Edit Citizen
// ═══════════════════════════════════════════════════════════
const CitizenModal = ({ citizen, onClose, onSaved, isAdmin }) => {
  const isEdit = !!citizen?._id;
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name:       citizen?.name       || '',
    email:      citizen?.email      || '',
    phone:      citizen?.phone      || '',
    dateOfBirth:citizen?.dateOfBirth ? citizen.dateOfBirth.slice(0,10) : '',
    gender:     citizen?.gender     || 'Male',
    aadhaar:    citizen?.aadhaar    || '',
    category:   citizen?.category   || 'General',
    occupation: citizen?.occupation || '',
    status:     citizen?.status     || 'Active',
    notes:      citizen?.notes      || '',
    address: {
      street:  citizen?.address?.street  || '',
      ward:    citizen?.address?.ward    || '',
      city:    citizen?.address?.city    || 'New Delhi',
      pincode: citizen?.address?.pincode || '',
    }
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm(f => ({ ...f, address: { ...f.address, [k]: v } }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.dateOfBirth || !form.gender) {
      return setError('Name, Email, Phone, Date of Birth, and Gender are required.');
    }
    setFormLoading(true); setError('');
    try {
      if (isEdit) {
        await API.put(`/citizens/${citizen._id}`, form);
      } else {
        await API.post('/citizens', form);
      }
      onSaved(isEdit ? 'Citizen record updated.' : 'New citizen registered.');
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally { setFormLoading(false); }
  };

  const inputCls = 'w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-darkbg-textMuted/50';
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-darkbg-card border border-darkbg-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-darkbg-card border-b border-darkbg-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
              {isEdit ? <Edit3 className="h-4 w-4 text-brand-400" /> : <Plus className="h-4 w-4 text-brand-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Citizen Record' : 'Register New Citizen'}</h2>
              {isEdit && <p className="text-xs text-darkbg-textMuted">{citizen.citizenId}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4 flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Arjun Sharma" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@domain.com" />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input className={inputCls} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="98XXXXXXXX" />
              </div>
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input className={inputCls} type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} max={new Date().toISOString().slice(0,10)} />
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select className={selectCls} value={form.gender} onChange={e=>set('gender',e.target.value)}>
                  {GENDERS.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Aadhaar (masked)</label>
                <input className={inputCls} value={form.aadhaar} onChange={e=>set('aadhaar',e.target.value)} placeholder="XXXX-XXXX-1234" maxLength={14} />
              </div>
              <div>
                <label className={labelCls}>Occupation</label>
                <input className={inputCls} value={form.occupation} onChange={e=>set('occupation',e.target.value)} placeholder="e.g. Teacher" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Street Address</label>
                <input className={inputCls} value={form.address.street} onChange={e=>setAddr('street',e.target.value)} placeholder="e.g. 12 Gandhi Road" />
              </div>
              <div>
                <label className={labelCls}>Ward</label>
                <select className={selectCls} value={form.address.ward} onChange={e=>setAddr('ward',e.target.value)}>
                  <option value="">Select Ward</option>
                  {WARDS.map(w=><option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input className={inputCls} value={form.address.pincode} onChange={e=>setAddr('pincode',e.target.value)} placeholder="110001" maxLength={6} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={form.address.city} onChange={e=>setAddr('city',e.target.value)} />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Classification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select className={selectCls} value={form.category} onChange={e=>set('category',e.target.value)}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={selectCls} value={form.status} onChange={e=>set('status',e.target.value)}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea className={inputCls} rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any additional notes..." />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-darkbg-border rounded-xl text-sm font-medium text-darkbg-textMuted hover:text-white hover:border-darkbg-textMuted transition-all">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
              {formLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Register Citizen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// HISTORY PANEL (side drawer)
// ═══════════════════════════════════════════════════════════
const HistoryDrawer = ({ citizenId, citizenName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citizenId) return;
    setLoading(true);
    API.get(`/citizens/${citizenId}/history`)
      .then(r => setHistory(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citizenId]);

  const actionColor = a => ({
    Created: 'text-emerald-400 bg-emerald-500/15',
    Updated: 'text-blue-400    bg-blue-500/15',
    Deleted: 'text-red-400     bg-red-500/15',
    Restored:'text-amber-400   bg-amber-500/15',
  }[a] || 'text-slate-400 bg-slate-500/15');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-darkbg-card border-l border-darkbg-border h-full flex flex-col shadow-2xl animate-slide-in">
        <div className="px-5 py-4 border-b border-darkbg-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" /> Audit History
            </h2>
            <p className="text-xs text-darkbg-textMuted mt-0.5">{citizenName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-12 text-center text-darkbg-textMuted text-sm">
              <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-darkbg-textMuted text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No history yet.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={h._id} className="relative">
                  {i < history.length-1 && <div className="absolute left-4 top-10 bottom-0 w-px bg-darkbg-border" />}
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${actionColor(h.action)}`}>
                      {h.action[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${actionColor(h.action)}`}>{h.action}</span>
                        <span className="text-xs text-darkbg-textMuted">{fmtDate(h.created_at)}</span>
                      </div>
                      <p className="text-xs text-white font-medium mt-1">By: {h.changedBy}</p>
                      {Object.keys(h.changes || {}).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(h.changes).map(([field, { from, to }]) => (
                            <div key={field} className="bg-darkbg-pure rounded-lg px-3 py-1.5 text-[11px]">
                              <span className="text-darkbg-textMuted font-semibold uppercase">{field}: </span>
                              <span className="text-red-400 line-through">{String(JSON.stringify(from)).slice(0,30)}</span>
                              <span className="text-darkbg-textMuted mx-1">→</span>
                              <span className="text-emerald-400">{String(JSON.stringify(to)).slice(0,30)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
const StatCard = ({ label, value, Icon, color, sub }) => (
  <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-xs text-darkbg-textMuted font-medium leading-none mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-darkbg-textMuted/60 mt-1">{sub}</p>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
const CitizensPage = () => {
  const { user } = useAuth();
  const isAdmin    = ['Admin','Operator'].includes(user?.role);
  const canDelete  = user?.role === 'Admin';

  // ── Data state ──────────────────────────────────────────
  const [citizens,   setCitizens]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState({ total:0, page:1, limit:10, totalPages:1 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // ── Search & filter state ───────────────────────────────
  const [query,      setQuery]      = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWard,     setFilterWard]     = useState('');
  const [filterGender,   setFilterGender]   = useState('');
  const [sortField,  setSortField]  = useState('created_at');
  const [sortOrder,  setSortOrder]  = useState('desc');
  const [page,       setPage]       = useState(1);
  const [searchMode, setSearchMode] = useState(false); // true = linked-list search

  // ── UI state ────────────────────────────────────────────
  const [modal,     setModal]     = useState(null);  // null | 'add' | citizenDoc
  const [historyOf, setHistoryOf] = useState(null);  // { _id, name }
  const [selected,  setSelected]  = useState(new Set());
  const [viewCitizen, setViewCitizen] = useState(null);

  const searchTimer = useRef(null);

  // ── Fetch data ──────────────────────────────────────────
  const fetchCitizens = useCallback(async (overrides = {}) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({
        q:        overrides.query      ?? query,
        status:   overrides.status     ?? filterStatus,
        category: overrides.category   ?? filterCategory,
        ward:     overrides.ward       ?? filterWard,
        gender:   overrides.gender     ?? filterGender,
        sort:     overrides.sort       ?? sortField,
        order:    overrides.order      ?? sortOrder,
        page:     overrides.page       ?? page,
        limit:    10,
      });
      const res = await API.get(`/citizens?${params}`);
      setCitizens(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load citizens.');
    } finally { setLoading(false); }
  }, [query, filterStatus, filterCategory, filterWard, filterGender, sortField, sortOrder, page]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await API.get('/citizens/stats');
      setStats(r.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchCitizens(); fetchStats(); }, []);

  // ── Debounced linked-list search ─────────────────────────
  useEffect(() => {
    if (!query.trim()) { setSearchMode(false); fetchCitizens({ query: '' }); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await API.get(`/citizens/search?q=${encodeURIComponent(query)}`);
        setCitizens(r.data.data || []);
        setPagination({ total: r.data.count, page: 1, limit: r.data.count, totalPages: 1 });
        setSearchMode(true);
      } catch { fetchCitizens(); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const notify = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // ── Actions ─────────────────────────────────────────────
  const handleDelete = async (citizen) => {
    if (!window.confirm(`Deactivate "${citizen.name}"?`)) return;
    try {
      await API.delete(`/citizens/${citizen._id}`);
      notify(`${citizen.name} deactivated.`);
      fetchCitizens(); fetchStats();
    } catch (err) { notify(err.response?.data?.message || 'Delete failed.', true); }
  };

  const handleSeed = async () => {
    try {
      const r = await API.post('/citizens/seed');
      notify(r.data.message);
      fetchCitizens(); fetchStats();
    } catch (err) { notify(err.response?.data?.message || 'Seed failed.', true); }
  };

  const handleSaved = (msg) => {
    setModal(null); notify(msg);
    fetchCitizens(); fetchStats();
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      const next = sortOrder === 'desc' ? 'asc' : 'desc';
      setSortOrder(next);
      fetchCitizens({ sort: field, order: next });
    } else {
      setSortField(field); setSortOrder('asc');
      fetchCitizens({ sort: field, order: 'asc' });
    }
  };

  const applyFilters = (overrides = {}) => {
    setPage(1);
    fetchCitizens({ page: 1, ...overrides });
  };

  const clearFilters = () => {
    setFilterStatus(''); setFilterCategory(''); setFilterWard(''); setFilterGender('');
    setQuery(''); setSearchMode(false); setPage(1);
    fetchCitizens({ query:'', status:'', category:'', ward:'', gender:'', page:1 });
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <SortAsc className="h-3.5 w-3.5 opacity-30" />;
    return sortOrder === 'asc'
      ? <SortAsc  className="h-3.5 w-3.5 text-brand-400" />
      : <SortDesc className="h-3.5 w-3.5 text-brand-400" />;
  };

  const hasFilters = filterStatus || filterCategory || filterWard || filterGender || query;

  const selectCls = 'bg-darkbg-pure border border-darkbg-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors cursor-pointer';

  return (
    <div className="space-y-6">
      <SEO title="Citizen Records" description="Smart City citizens directory, doubly linked list database traversals." />

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-500" /> Citizen Records
          </h1>
          <p className="text-darkbg-textMuted text-sm mt-0.5">
            Doubly-Linked List · CRUD · Audit History · Pagination
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { fetchCitizens(); fetchStats(); }}
            className="flex items-center gap-2 px-3 py-2 bg-darkbg-card border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button onClick={handleSeed}
              className="flex items-center gap-2 px-3 py-2 bg-darkbg-card border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white transition-all">
              <Upload className="h-4 w-4" /> Seed Demo
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-brand-500/20">
              <Plus className="h-4 w-4" /> Register Citizen
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

      {/* ── Stat cards ────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Citizens"    value={stats.total}            Icon={Users}      color="bg-brand-500/15 text-brand-400" sub={`${stats.linkedListSize} in linked list`} />
          <StatCard label="Active"            value={stats.active}           Icon={Activity}   color="bg-emerald-500/15 text-emerald-400" />
          <StatCard label="Inactive"          value={stats.inactive}         Icon={Shield}     color="bg-slate-500/15 text-slate-400" />
          <StatCard label="Registered Today"  value={stats.registeredToday}  Icon={Calendar}   color="bg-amber-500/15 text-amber-400" />
        </div>
      )}

      {/* ── Search + Filters ─────────────────────────────── */}
      <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darkbg-textMuted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, ID, email, or phone… (Linked List traversal)"
            className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchMode(false); fetchCitizens({ query: '' }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-darkbg-textMuted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchMode && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5">
            <Hash className="h-3 w-3" />
            Linked-List traversal — {pagination.total} result(s) found
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-4 w-4 text-darkbg-textMuted shrink-0" />
          <select value={filterStatus}   onChange={e=>{setFilterStatus(e.target.value);   applyFilters({status: e.target.value});}}   className={selectCls}>
            <option value="">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCategory} onChange={e=>{setFilterCategory(e.target.value); applyFilters({category: e.target.value});}} className={selectCls}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterWard}     onChange={e=>{setFilterWard(e.target.value);     applyFilters({ward: e.target.value});}}     className={selectCls}>
            <option value="">All Wards</option>
            {WARDS.map(w=><option key={w} value={w}>{w}</option>)}
          </select>
          <select value={filterGender}   onChange={e=>{setFilterGender(e.target.value);   applyFilters({gender: e.target.value});}}   className={selectCls}>
            <option value="">All Genders</option>
            {GENDERS.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 rounded-lg transition-all">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          {/* Sort selector */}
          <div className="ml-auto flex items-center gap-2">
            <select value={sortField} onChange={e=>{setSortField(e.target.value); fetchCitizens({sort: e.target.value});}} className={`${selectCls} text-xs`}>
              {SORT_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={()=>{const next=sortOrder==='desc'?'asc':'desc'; setSortOrder(next); fetchCitizens({order:next});}}
              className="p-2 border border-darkbg-border rounded-lg text-darkbg-textMuted hover:text-white transition-all">
              {sortOrder==='desc' ? <SortDesc className="h-4 w-4"/> : <SortAsc className="h-4 w-4"/>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-darkbg-card border border-darkbg-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-darkbg-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">
              Citizens
              <span className="ml-2 text-darkbg-textMuted font-normal">({pagination.total ?? 0})</span>
            </h2>
            {loading && <RefreshCw className="h-3.5 w-3.5 text-brand-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-darkbg-textMuted">
            <List className="h-3.5 w-3.5" />
            Linked List Nodes: <span className="text-white font-semibold ml-1">{stats?.linkedListSize ?? '—'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-darkbg-border">
                {[
                  { label: 'Citizen ID',  field: 'citizenId'  },
                  { label: 'Name',        field: 'name'       },
                  { label: 'Contact',     field: null         },
                  { label: 'Ward',        field: 'address.ward' },
                  { label: 'Category',   field: 'category'   },
                  { label: 'Status',      field: 'status'     },
                  { label: 'Registered',  field: 'created_at' },
                  { label: 'Actions',     field: null         },
                ].map(col => (
                  <th key={col.label}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted">
                    {col.field ? (
                      <button onClick={()=>toggleSort(col.field)} className="flex items-center gap-1.5 hover:text-white transition-all">
                        {col.label} <SortIcon field={col.field} />
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-darkbg-border">
              {loading && citizens.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-darkbg-textMuted text-sm">
                  <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin" /> Loading citizens…
                </td></tr>
              ) : citizens.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-darkbg-textMuted text-sm">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  No citizens found. {isAdmin && <button onClick={handleSeed} className="text-brand-400 hover:underline">Seed demo data</button>}
                </td></tr>
              ) : citizens.map(c => (
                <tr key={c._id} className="hover:bg-darkbg-border/20 transition-all group">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-brand-400 font-bold">{c.citizenId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{c.name}</p>
                        <p className="text-darkbg-textMuted text-[10px]">{c.gender} · {age(c.dateOfBirth)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-darkbg-textMuted flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>
                    <p className="text-xs text-darkbg-textMuted flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-darkbg-textMuted">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address?.ward || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Chip className={catColor(c.category)}>{c.category}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip className={statusColor(c.status)}>{c.status}</Chip>
                  </td>
                  <td className="px-4 py-3 text-xs text-darkbg-textMuted">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button title="View" onClick={()=>setViewCitizen(c)}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <button title="Edit" onClick={()=>setModal(c)}
                          className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-all">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button title="History" onClick={()=>setHistoryOf(c)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all">
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      {canDelete && (
                        <button title="Deactivate" onClick={()=>handleDelete(c)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!searchMode && pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-darkbg-border flex items-center justify-between">
            <p className="text-xs text-darkbg-textMuted">
              Showing {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={pagination.page <= 1} onClick={()=>{const p=page-1; setPage(p); fetchCitizens({page:p});}}
                className="p-2 rounded-lg border border-darkbg-border text-darkbg-textMuted hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({length: Math.min(pagination.totalPages, 7)}, (_,i)=>{
                const p = pagination.page <= 4 ? i+1 : pagination.page - 3 + i;
                if (p < 1 || p > pagination.totalPages) return null;
                return (
                  <button key={p} onClick={()=>{setPage(p); fetchCitizens({page:p});}}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p===pagination.page ? 'bg-brand-500 text-white' : 'text-darkbg-textMuted hover:text-white border border-darkbg-border'}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={pagination.page >= pagination.totalPages} onClick={()=>{const p=page+1; setPage(p); fetchCitizens({page:p});}}
                className="p-2 rounded-lg border border-darkbg-border text-darkbg-textMuted hover:text-white disabled:opacity-30 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>



      {/* ── Modals / Drawers ──────────────────────────────── */}
      {modal && (
        <CitizenModal
          citizen={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          isAdmin={isAdmin}
        />
      )}
      {historyOf && (
        <HistoryDrawer
          citizenId={historyOf._id}
          citizenName={historyOf.name}
          onClose={() => setHistoryOf(null)}
        />
      )}

      {/* Quick view modal */}
      {viewCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewCitizen(null)} />
          <div className="relative bg-darkbg-card border border-darkbg-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-darkbg-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" /> Citizen Details
              </h2>
              <button onClick={() => setViewCitizen(null)} className="p-2 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xl">
                  {viewCitizen.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{viewCitizen.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-xs text-brand-400">{viewCitizen.citizenId}</span>
                    <Chip className={statusColor(viewCitizen.status)}>{viewCitizen.status}</Chip>
                    <Chip className={catColor(viewCitizen.category)}>{viewCitizen.category}</Chip>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label:'Email',       val: viewCitizen.email,                Icon: Mail     },
                  { label:'Phone',       val: viewCitizen.phone,                Icon: Phone    },
                  { label:'Gender',      val: viewCitizen.gender,               Icon: User     },
                  { label:'Age',         val: age(viewCitizen.dateOfBirth),     Icon: Calendar },
                  { label:'Ward',        val: viewCitizen.address?.ward || '—', Icon: MapPin   },
                  { label:'Occupation',  val: viewCitizen.occupation || '—',    Icon: Shield   },
                ].map(({ label, val, Icon }) => (
                  <div key={label} className="bg-darkbg-pure rounded-lg px-3 py-2 flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-darkbg-textMuted shrink-0" />
                    <div>
                      <p className="text-[10px] text-darkbg-textMuted">{label}</p>
                      <p className="text-white font-medium">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
              {viewCitizen.notes && (
                <div className="bg-darkbg-pure rounded-lg px-4 py-3 text-xs text-darkbg-textMuted">
                  <p className="text-[10px] uppercase font-semibold mb-1">Notes</p>
                  {viewCitizen.notes}
                </div>
              )}
              <div className="flex gap-2">
                {isAdmin && (
                  <button onClick={() => { setViewCitizen(null); setModal(viewCitizen); }}
                    className="flex-1 py-2 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                <button onClick={() => { setViewCitizen(null); setHistoryOf(viewCitizen); }}
                  className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizensPage;
