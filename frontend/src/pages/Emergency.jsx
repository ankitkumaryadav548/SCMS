import React, { useState } from 'react';
import { AlertOctagon, Flame, ShieldAlert, HeartHandshake, Eye } from 'lucide-react';

const Emergency = () => {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      title: 'Substation Fire Incident',
      type: 'Fire',
      severity: 'Critical',
      status: 'Dispatched',
      location: '40.712000, -74.001000',
      description: 'Electrical fire inside central distribution cabinet.'
    },
    {
      id: 2,
      title: 'Water Main Failure',
      type: 'Flood',
      severity: 'High',
      status: 'Reported',
      location: '40.730000, -73.930000',
      description: 'Pipeline leak causing massive pressure drop in sector B.'
    },
    {
      id: 3,
      title: 'Highway 9 Vehicle Crash',
      type: 'Accident',
      severity: 'Medium',
      status: 'Resolved',
      location: '40.758000, -73.980000',
      description: 'Minor collision. Debris cleared.'
    }
  ]);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Dispatched':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'Reported':
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Emergency Incident Dispatch</h1>
        <p className="text-darkbg-textMuted text-sm mt-1">
          Monitor active hazards and trigger routing strategies to reduce emergency vehicle arrival latencies.
        </p>
      </div>

      <div className="bg-darkbg-card border border-darkbg-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-darkbg-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Logs</h2>
          <button className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
            File New Incident Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkbg-pure border-b border-darkbg-border text-xs text-darkbg-textMuted uppercase font-semibold">
                <th className="px-6 py-4">Incident Details</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkbg-border text-sm">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-darkbg-pure/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white block">{inc.title}</span>
                    <span className="text-xs text-darkbg-textMuted mt-0.5 block">{inc.description}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5">
                      {inc.type === 'Fire' && <Flame className="h-4 w-4 text-rose-400" />}
                      {inc.type === 'Flood' && <Eye className="h-4 w-4 text-blue-400" />}
                      {inc.type === 'Accident' && <ShieldAlert className="h-4 w-4 text-amber-400" />}
                      <span className="text-darkbg-text">{inc.type}</span>
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
                  <td className="px-6 py-4 text-xs font-mono text-darkbg-textMuted">{inc.location}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand-500 hover:text-brand-400 font-semibold text-xs inline-flex items-center gap-1">
                      <HeartHandshake className="h-4 w-4" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Emergency;
