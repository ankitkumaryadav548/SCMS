import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Folder, FolderOpen, User, Users, Plus, Edit3, Trash2, Search,
  ChevronDown, ChevronRight, RefreshCw, AlertCircle, CheckCircle,
  Building, Network, Info, Shield, Layers, HelpCircle, X, Check,
  Briefcase, Mail, Phone, DollarSign, Calendar, MapPin, Hash
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const NODE_TYPES = ['Department', 'SubDepartment', 'Employee'];
const STATUSES = ['Active', 'Inactive', 'On Leave'];

// Custom badge colors
const typeBadgeColor = type => {
  if (type === 'Department') return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (type === 'SubDepartment') return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
  return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
};

const statusBadgeColor = status => {
  if (status === 'Active') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (status === 'Inactive') return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
};

// Helper for formatting currency
const formatINR = val => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

// ═══════════════════════════════════════════════════════════
// REACT TREE COMPONENT (RECURSIVE NODE)
// ═══════════════════════════════════════════════════════════
const TreeNode = ({
  node,
  expandedNodes,
  toggleExpand,
  selectedNode,
  setSelectedNode,
  onAddChild,
  onEdit,
  onDelete,
  isAdmin,
  searchQuery
}) => {
  const isExpanded = expandedNodes.has(node._id);
  const isSelected = selectedNode && selectedNode._id === node._id;
  const hasChildren = node.children && node.children.length > 0;

  // Render matching text highlights
  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getNodeIcon = () => {
    if (node.type === 'Department') return <Building className={`h-4 w-4 ${isSelected ? 'text-blue-300' : 'text-blue-400'}`} />;
    if (node.type === 'SubDepartment') return <Network className={`h-4 w-4 ${isSelected ? 'text-violet-300' : 'text-violet-400'}`} />;
    return <User className={`h-4 w-4 ${isSelected ? 'text-cyan-300' : 'text-cyan-400'}`} />;
  };

  return (
    <div className="ml-4">
      {/* Node Element */}
      <div
        className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-sm mb-1 border select-none ${
          isSelected
            ? 'bg-brand-500/25 border-brand-500 text-white shadow-md shadow-brand-500/10'
            : 'border-transparent text-darkbg-textMuted hover:bg-darkbg-border/30 hover:text-white'
        }`}
        onClick={() => setSelectedNode(node)}
      >
        {/* Toggle Arrow (only if children exist or it's a structural type) */}
        {node.type !== 'Employee' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node._id);
            }}
            className="p-1 rounded-lg text-darkbg-textMuted hover:text-white hover:bg-darkbg-border transition-all"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5 h-5 shrink-0" /> // spacer
        )}

        {/* Icon */}
        <div className="shrink-0">{getNodeIcon()}</div>

        {/* Name / Label */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-semibold truncate">
            {highlightText(node.name, searchQuery)}
          </span>
          {node.code && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-darkbg-pure border border-darkbg-border text-darkbg-textMuted group-hover:text-white transition-colors">
              {highlightText(node.code, searchQuery)}
            </span>
          )}
          {node.type === 'Employee' && node.designation && (
            <span className="text-xs text-darkbg-textMuted truncate">
              — {highlightText(node.designation, searchQuery)}
            </span>
          )}
        </div>

        {/* Action icons shown on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shrink-0">
          {isAdmin && node.type !== 'Employee' && (
            <button
              type="button"
              title={`Add child to ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              title="Edit Node"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/15"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              title="Delete Node and Subtree"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node);
              }}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Children Nodes (Recursive) */}
      {hasChildren && isExpanded && (
        <div className="relative border-l border-darkbg-border ml-3 pl-1 transition-all duration-300">
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// BREADCRUMBS
// ═══════════════════════════════════════════════════════════
const Breadcrumbs = ({ node, flatData }) => {
  if (!node) return null;
  const path = [];
  let cur = node;

  while (cur) {
    path.unshift(cur);
    if (cur.parentId) {
      cur = flatData.find(d => d._id === cur.parentId);
    } else {
      cur = null;
    }
  }

  return (
    <div className="flex items-center gap-1 text-[11px] text-darkbg-textMuted bg-darkbg-pure px-3 py-1.5 rounded-lg border border-darkbg-border flex-wrap max-w-full">
      {path.map((p, idx) => (
        <React.Fragment key={p._id}>
          {idx > 0 && <span className="text-darkbg-textMuted/40">/</span>}
          <span className={`font-semibold ${idx === path.length - 1 ? 'text-brand-400' : ''}`}>
            {p.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DETAILS PANEL component
// ═══════════════════════════════════════════════════════════
const DetailPanel = ({ node, flatData, onEdit, onDelete, isAdmin }) => {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-darkbg-textMuted/50">
        <Building className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm">Select a department, sub-department, or employee node in the tree to view comprehensive details.</p>
      </div>
    );
  }

  const parentNode = node.parentId ? flatData.find(d => d._id === node.parentId) : null;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
          node.type === 'Department' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
          node.type === 'SubDepartment' ? 'bg-violet-500/10 text-violet-400 border-violet-500/25' :
          'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
        }`}>
          {node.type === 'Department' ? <Building className="h-6 w-6" /> :
           node.type === 'SubDepartment' ? <Network className="h-6 w-6" /> :
           <User className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadgeColor(node.type)}`}>
              {node.type}
            </span>
            {node.status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor(node.status)}`}>
                {node.status}
              </span>
            )}
            {node.code && (
              <span className="font-mono text-xs text-brand-400 bg-brand-500/5 border border-brand-500/20 px-1.5 py-0.2 rounded font-bold uppercase">
                {node.code}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mt-1 truncate">{node.name}</h2>
          <p className="text-xs text-darkbg-textMuted mt-0.5">Hierarchy Path:</p>
          <div className="mt-1">
            <Breadcrumbs node={node} flatData={flatData} />
          </div>
        </div>
      </div>

      {/* Grid of properties based on type */}
      <div className="grid grid-cols-2 gap-4">
        {node.type !== 'Employee' ? (
          // Department & SubDepartment properties
          <>
            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <User className="h-5 w-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Head of Division</p>
                <p className="text-sm font-semibold text-white truncate">{node.head || '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Annual Budget</p>
                <p className="text-sm font-semibold text-white">{node.budget ? formatINR(node.budget) : '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <MapPin className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Office Location</p>
                <p className="text-sm font-semibold text-white truncate">{node.location || '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Established</p>
                <p className="text-sm font-semibold text-white">{node.established || '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3 col-span-2">
              <Mail className="h-5 w-5 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Official Contact & Email</p>
                <p className="text-sm font-semibold text-white truncate">{node.email || '—'}</p>
                {node.contact && <p className="text-xs text-darkbg-textMuted mt-0.5">{node.contact}</p>}
              </div>
            </div>
          </>
        ) : (
          // Employee properties
          <>
            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Designation</p>
                <p className="text-sm font-semibold text-white truncate">{node.designation || '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <Hash className="h-5 w-5 text-brand-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Employee ID</p>
                <p className="text-sm font-semibold text-white truncate">{node.employeeId || '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Monthly Salary</p>
                <p className="text-sm font-semibold text-white">{node.salary ? formatINR(node.salary) : '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3">
              <Calendar className="h-5 w-5 text-violet-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Join Date</p>
                <p className="text-sm font-semibold text-white">{node.joinDate ? new Date(node.joinDate).toLocaleDateString('en-IN') : '—'}</p>
              </div>
            </div>

            <div className="bg-darkbg-pure rounded-xl p-3 border border-darkbg-border flex items-center gap-3 col-span-2">
              <Mail className="h-5 w-5 text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-darkbg-textMuted">Contact Info</p>
                <p className="text-sm font-semibold text-white truncate">{node.employeeEmail || '—'}</p>
                {node.phone && <p className="text-xs text-darkbg-textMuted mt-0.5">{node.phone}</p>}
              </div>
            </div>
          </>
        )}

        {/* Description / Notes */}
        {(node.description || node.notes) && (
          <div className="col-span-2 bg-darkbg-pure rounded-xl p-4 border border-darkbg-border">
            <p className="text-[10px] uppercase font-bold text-darkbg-textMuted mb-1">
              {node.type === 'Employee' ? 'Admin Notes' : 'Division Description'}
            </p>
            <p className="text-xs text-darkbg-textMuted leading-relaxed">{node.description || node.notes}</p>
          </div>
        )}

        {/* Parent relation link */}
        {parentNode && (
          <div className="col-span-2 bg-darkbg-pure/50 rounded-xl p-3 border border-darkbg-border/60 flex items-center justify-between text-xs text-darkbg-textMuted">
            <span>Parent Division:</span>
            <span className="font-semibold text-brand-400">{parentNode.name} ({parentNode.type})</span>
          </div>
        )}
      </div>

      {/* Admin Operations in Detail Panel */}
      {isAdmin && (
        <div className="flex gap-2.5 pt-2 border-t border-darkbg-border/60">
          {node.type !== 'Employee' && (
            <button
              onClick={() => onAddChild(node)}
              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Child Division/Staff
            </button>
          )}
          <button
            onClick={() => onEdit(node)}
            className="flex-1 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Details
          </button>
          <button
            onClick={() => onDelete(node)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// CREATE / EDIT DIALOG
// ═══════════════════════════════════════════════════════════
const NodeModal = ({ node, parentNode, typeOverride, onClose, onSaved }) => {
  const isEdit = !!node;
  const nodeType = isEdit ? node.type : typeOverride;
  const parentId = isEdit ? node.parentId : (parentNode ? parentNode._id : null);

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name:         node?.name         || '',
    code:         node?.code         || '',
    description:  node?.description  || '',
    head:         node?.head         || '',
    budget:       node?.budget       || 0,
    location:     node?.location     || '',
    contact:      node?.contact      || '',
    email:        node?.email        || '',
    established:  node?.established  || '',
    designation:  node?.designation  || '',
    employeeId:   node?.employeeId   || '',
    phone:        node?.phone        || '',
    employeeEmail:node?.employeeEmail|| '',
    joinDate:     node?.joinDate     ? node.joinDate.slice(0,10) : '',
    salary:       node?.salary       || 0,
    status:       node?.status       || 'Active'
  });

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    
    // Add additional validation depending on type
    if (nodeType === 'Employee') {
      if (!form.employeeId.trim()) return setError('Employee ID is required.');
    }

    setFormLoading(true); setError('');
    try {
      const payload = {
        ...form,
        type: nodeType,
        parentId: parentId || null
      };

      if (isEdit) {
        await API.put(`/departments/${node._id}`, payload);
      } else {
        await API.post('/departments', payload);
      }
      onSaved(isEdit ? 'Directory entry updated.' : 'New directory entry created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally { setFormLoading(false); }
  };

  const inputCls = 'w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors placeholder:text-darkbg-textMuted/40';
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-darkbg-textMuted mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-darkbg-card border border-darkbg-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-darkbg-card border-b border-darkbg-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              nodeType === 'Department' ? 'bg-blue-500/10 text-blue-400' :
              nodeType === 'SubDepartment' ? 'bg-violet-500/10 text-violet-400' :
              'bg-cyan-500/10 text-cyan-400'
            }`}>
              {isEdit ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEdit ? `Edit ${nodeType}` : `Register New ${nodeType}`}
              </h2>
              {parentNode && !isEdit && (
                <p className="text-xs text-darkbg-textMuted mt-0.5">Creating under parent: {parentNode.name}</p>
              )}
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

          {/* Standard Fields */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" /> Basic Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Name / Title *</label>
                <input className={inputCls} value={form.name} onChange={e=>setVal('name',e.target.value)} placeholder={nodeType === 'Employee' ? 'e.g. Rahul Verma' : 'e.g. Solid Waste Division'} />
              </div>
              {nodeType !== 'Employee' && (
                <div>
                  <label className={labelCls}>Division Code</label>
                  <input className={inputCls} value={form.code} onChange={e=>setVal('code',e.target.value)} placeholder="e.g. MCD-SW" />
                </div>
              )}
            </div>
          </div>

          {/* Specific Fields for Dept or SubDept */}
          {nodeType !== 'Employee' ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 flex items-center gap-2">
                <Building className="h-3.5 w-3.5" /> Structural Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Head of Division</label>
                  <input className={inputCls} value={form.head} onChange={e=>setVal('head',e.target.value)} placeholder="e.g. Rajiv Sharma" />
                </div>
                <div>
                  <label className={labelCls}>Annual Budget (₹)</label>
                  <input className={inputCls} type="number" value={form.budget} onChange={e=>setVal('budget',Number(e.target.value))} placeholder="5000000" />
                </div>
                <div>
                  <label className={labelCls}>Office Location</label>
                  <input className={inputCls} value={form.location} onChange={e=>setVal('location',e.target.value)} placeholder="e.g. Sector 5, Dwarka" />
                </div>
                <div>
                  <label className={labelCls}>Year Established</label>
                  <input className={inputCls} type="number" value={form.established} onChange={e=>setVal('established',Number(e.target.value))} placeholder="2005" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Official Email</label>
                  <input className={inputCls} type="email" value={form.email} onChange={e=>setVal('email',e.target.value)} placeholder="dept.info@smartcity.in" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Official Contact Number</label>
                  <input className={inputCls} value={form.contact} onChange={e=>setVal('contact',e.target.value)} placeholder="011-2345678" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Division Description</label>
                  <textarea className={inputCls} rows={3} value={form.description} onChange={e=>setVal('description',e.target.value)} placeholder="Write a summary of what this division operates..." />
                </div>
              </div>
            </div>
          ) : (
            // Specific Fields for Employee
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Staff Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Designation</label>
                  <input className={inputCls} value={form.designation} onChange={e=>setVal('designation',e.target.value)} placeholder="e.g. Assistant Engineer" />
                </div>
                <div>
                  <label className={labelCls}>Employee ID *</label>
                  <input className={inputCls} value={form.employeeId} onChange={e=>setVal('employeeId',e.target.value)} placeholder="e.g. EMP-1042" />
                </div>
                <div>
                  <label className={labelCls}>Monthly Salary (₹)</label>
                  <input className={inputCls} type="number" value={form.salary} onChange={e=>setVal('salary',Number(e.target.value))} placeholder="45000" />
                </div>
                <div>
                  <label className={labelCls}>Join Date</label>
                  <input className={inputCls} type="date" value={form.joinDate} onChange={e=>setVal('joinDate',e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Contact Phone</label>
                  <input className={inputCls} value={form.phone} onChange={e=>setVal('phone',e.target.value)} placeholder="981XXXXXXXX" />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input className={inputCls} type="email" value={form.employeeEmail} onChange={e=>setVal('employeeEmail',e.target.value)} placeholder="name@delhi.gov.in" />
                </div>
                <div>
                  <label className={labelCls}>Duty Status</label>
                  <select className={selectCls} value={form.status} onChange={e=>setVal('status',e.target.value)}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes</label>
                  <textarea className={inputCls} rows={2} value={form.description} onChange={e=>setVal('description',e.target.value)} placeholder="Add any background notes..." />
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-darkbg-border rounded-xl text-sm font-medium text-darkbg-textMuted hover:text-white hover:border-darkbg-textMuted transition-all">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
              {formLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════
const DepartmentsPage = () => {
  const { user } = useAuth();
  const isAdmin = ['Admin', 'Operator'].includes(user?.role);

  // ── States ──────────────────────────────────────────────
  const [treeData, setTreeData] = useState([]);
  const [flatData, setFlatData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // BFS Visualizer level order state
  const [bfsData, setBfsData] = useState(null);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'bfs'
  const [bfsLoading, setBfsLoading] = useState(false);

  // Modals state
  const [nodeModal, setNodeModal] = useState(null); // null | { node: null/doc, parentNode: null/doc, type: 'Department'/'SubDepartment'/'Employee' }

  // ── Fetch directory tree ────────────────────────────────
  const fetchDirectory = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await API.get('/departments/tree');
      setTreeData(res.data.data || []);
      
      // Also fetch stats
      const statsRes = await API.get('/departments/stats');
      setStats(statsRes.data.data);

      // Flatten tree helper to lookup parents easily in breadcrumbs
      const flatList = [];
      const flatten = arr => {
        arr.forEach(n => {
          flatList.push(n);
          if (n.children) flatten(n.children);
        });
      };
      flatten(res.data.data || []);
      setFlatData(flatList);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load department tree.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Toast notifier
  const notify = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // ── Expand/Collapse logic ──────────────────────────────
  const toggleExpand = id => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = new Set();
    const collect = arr => {
      arr.forEach(n => {
        if (n.type !== 'Employee') {
          ids.add(n._id);
          if (n.children) collect(n.children);
        }
      });
    };
    collect(treeData);
    setExpandedNodes(ids);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // ── Seed tree ───────────────────────────────────────────
  const handleSeedTree = async () => {
    setLoading(true);
    try {
      const r = await API.post('/departments/seed');
      notify(r.data.message);
      fetchDirectory();
    } catch (err) {
      notify(err.response?.data?.message || 'Seeding failed.', true);
    } finally { setLoading(false); }
  };

  // ── Search Traversal DFS ────────────────────────────────
  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const res = await API.get(`/departments/search?q=${encodeURIComponent(val)}`);
      setSearchResults(res.data.data || []);
      setShowSearchResults(true);
    } catch {}
  };

  // Select node from search results & expand path to it
  const selectSearchResult = (item) => {
    const node = item.node;
    setSelectedNode(node);
    setShowSearchResults(false);

    // Collect all parent IDs of the target node to expand them
    const parentIdsToExpand = [];
    let curParentId = node.parentId;
    while (curParentId) {
      parentIdsToExpand.push(curParentId);
      const parent = flatData.find(d => d._id === curParentId);
      curParentId = parent ? parent.parentId : null;
    }

    setExpandedNodes(prev => {
      const next = new Set(prev);
      parentIdsToExpand.forEach(id => next.add(id));
      return next;
    });
  };

  // ── BFS view loader ─────────────────────────────────────
  const loadBFS = async () => {
    setActiveTab('bfs');
    setBfsLoading(true);
    try {
      const res = await API.get('/departments/bfs');
      setBfsData(res.data.data || []);
    } catch (err) {
      notify('Failed to load BFS levels.', true);
    } finally { setBfsLoading(false); }
  };

  // ── Mutation CRUD actions ──────────────────────────────
  const handleAddChild = parentNode => {
    const nextType = parentNode.type === 'Department' ? 'SubDepartment' : 'Employee';
    setNodeModal({ node: null, parentNode, type: nextType });
  };

  const handleEdit = node => {
    setNodeModal({ node, parentNode: null, type: node.type });
  };

  const handleDelete = async (node) => {
    const confirmMsg = node.type === 'Employee'
      ? `Are you sure you want to remove staff member "${node.name}"?`
      : `Are you sure you want to delete "${node.name}"? This will recursively DELETE ALL SUB-DEPARTMENTS AND EMPLOYEES under it!`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await API.delete(`/departments/${node._id}`);
      notify('Directory entry deleted successfully.');
      if (selectedNode && selectedNode._id === node._id) {
        setSelectedNode(null);
      }
      fetchDirectory();
    } catch (err) {
      notify(err.response?.data?.message || 'Delete operation failed.', true);
    }
  };

  const handleSaved = msg => {
    setNodeModal(null);
    notify(msg);
    fetchDirectory();
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building className="h-6 w-6 text-brand-500" /> Department Directory
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDirectory}
            className="flex items-center gap-2 px-3 py-2 bg-darkbg-card border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {isAdmin && (
            <button
              onClick={handleSeedTree}
              className="flex items-center gap-2 px-3 py-2 bg-darkbg-card border border-darkbg-border rounded-lg text-sm text-darkbg-textMuted hover:text-white transition-all"
            >
              <Layers className="h-4 w-4" /> Seed Structure
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setNodeModal({ node: null, parentNode: null, type: 'Department' })}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-brand-500/20"
            >
              <Plus className="h-4 w-4" /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Warnings & Success toasts */}
      {error   && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {success && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm"><CheckCircle className="h-4 w-4 shrink-0" />{success}</div>}

      {/* ── Stats grid ────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.departments}</p>
              <p className="text-[10px] text-darkbg-textMuted uppercase font-bold">Departments</p>
            </div>
          </div>
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.subDepartments}</p>
              <p className="text-[10px] text-darkbg-textMuted uppercase font-bold">Sub-Divisions</p>
            </div>
          </div>
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.employees}</p>
              <p className="text-[10px] text-darkbg-textMuted uppercase font-bold">Total Staff</p>
            </div>
          </div>
          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.totalNodes}</p>
              <p className="text-[10px] text-darkbg-textMuted uppercase font-bold">Directory Size</p>
            </div>
          </div>
        </div>
      )}

      {/* Tree Directory View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tree column */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search + controls */}
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darkbg-textMuted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="DFS Search department/staff/role…"
                  className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-darkbg-textMuted hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search dropdown results */}
              {showSearchResults && (
                <div className="bg-darkbg-pure border border-darkbg-border rounded-lg max-h-48 overflow-y-auto divide-y divide-darkbg-border/60">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-4 text-xs text-darkbg-textMuted">No matches found in tree DFS</div>
                  ) : (
                    searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-darkbg-border/30 transition-all flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          {item.node.name}
                          <span className={`text-[8px] uppercase px-1 rounded border ${typeBadgeColor(item.node.type)}`}>
                            {item.node.type}
                          </span>
                        </span>
                        <span className="text-[10px] text-darkbg-textMuted truncate">{item.path}</span>
                      </button>
                    ))
                  )}
                </div>
              )}


            </div>

            {/* Core Tree Panel */}
            <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-4 min-h-[300px] max-h-[550px] overflow-y-auto pr-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-darkbg-textMuted mb-3">Directory tree</h3>
              {loading && treeData.length === 0 ? (
                <div className="py-12 text-center text-darkbg-textMuted text-xs">
                  <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin text-brand-400" /> Loading Tree structure…
                </div>
              ) : treeData.length === 0 ? (
                <div className="py-12 text-center text-darkbg-textMuted text-xs space-y-3">
                  <Building className="h-10 w-10 mx-auto opacity-20" />
                  <p>Structure directory is empty.</p>
                  {isAdmin && (
                    <button onClick={handleSeedTree} className="text-brand-400 hover:underline font-semibold">
                      Load Delhi Administration Seed Structure
                    </button>
                  )}
                </div>
              ) : (
                <div className="-ml-4">
                  {treeData.map((node) => (
                    <TreeNode
                      key={node._id}
                      node={node}
                      expandedNodes={expandedNodes}
                      toggleExpand={toggleExpand}
                      selectedNode={selectedNode}
                      setSelectedNode={setSelectedNode}
                      onAddChild={handleAddChild}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isAdmin={isAdmin}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel column */}
          <div className="lg:col-span-7 bg-darkbg-card border border-darkbg-border rounded-xl p-5 min-h-[400px]">
            <DetailPanel
              node={selectedNode}
              flatData={flatData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          </div>
        </div>

      {/* Add / Edit Modal */}
      {nodeModal && (
        <NodeModal
          node={nodeModal.node}
          parentNode={nodeModal.parentNode}
          typeOverride={nodeModal.type}
          onClose={() => setNodeModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default DepartmentsPage;
