import React, { useState, useEffect } from 'react';
import ChartCard from '../components/ChartCard';
import LeafletMap from '../components/LeafletMap';
import { Car, AlertTriangle, Battery, ShieldAlert, Cpu } from 'lucide-react';
import API from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    sensorsCount: 5,
    emergenciesCount: 3,
    utilityStatus: 'Normal',
    algorithmCalls: 42
  });

  const chartData = {
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    datasets: [
      {
        label: 'Average Speed (km/h)',
        data: [42, 28, 35, 22, 18, 30, 48],
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Traffic Density (%)',
        data: [35, 68, 55, 80, 92, 60, 25],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af', font: { family: 'Inter' } }
      }
    },
    scales: {
      x: { grid: { color: '#232d45' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#232d45' }, ticks: { color: '#9ca3af' } }
    }
  };

  const mapMarkers = [
    { lat: 40.712776, lng: -74.005974, title: 'Central Junction', description: 'Sensor ID 1: Busy traffic flow' },
    { lat: 40.730610, lng: -73.935242, title: 'West Highway Gate', description: 'Sensor ID 2: High speed flow' },
    { lat: 40.715000, lng: -74.008000, title: 'Warehouse Fire Inc.', description: 'Severity: Critical Fire hazard' }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Smart City Core Operations</h1>
        <p className="text-darkbg-textMuted text-sm mt-1">Real-time status updates and telemetry metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-lg">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider block">Active Sensors</span>
            <span className="text-2xl font-bold text-white">{stats.sensorsCount}</span>
          </div>
        </div>

        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider block">Active Emergencies</span>
            <span className="text-2xl font-bold text-white">{stats.emergenciesCount}</span>
          </div>
        </div>

        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Battery className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider block">Utility Outages</span>
            <span className="text-2xl font-bold text-white">{stats.utilityStatus}</span>
          </div>
        </div>

        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider block">DSA Algorithm Actions</span>
            <span className="text-2xl font-bold text-white">{stats.algorithmCalls}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout for Map & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-bold text-white">Live Operations Topology Map</h2>
          <LeafletMap markers={mapMarkers} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Sensor Traffic Analytics</h2>
          <ChartCard title="Hourly Telemetry Chart" type="line" data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
