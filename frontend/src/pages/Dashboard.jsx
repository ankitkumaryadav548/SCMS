import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ChartCard from '../components/ChartCard';
import LeafletMap from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SEO from '../components/SEO';
import { LoadingScreen } from '../components/LoadingScreen';
import {
  Users, Calendar, DollarSign, Car, AlertTriangle, RefreshCw,
  TrendingUp, ArrowUpRight, ShieldCheck, Building, Radio, Activity, Layers
} from 'lucide-react';
import API from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Core KPI State ──
  const [kpis, setKpis] = useState({
    bookings: 48,
    pendingBookings: 8,
    approvedBookings: 32,
    cancelledBookings: 8,
    users: 124,
    parking: { total: 50, occupied: 32, available: 18 },
    trafficIncidents: 6,
    revenue: 15400
  });

  // ── Chart States ──
  const [bookingsChart, setBookingsChart] = useState({
    pie: {
      labels: ['Pending', 'Approved', 'Cancelled'],
      datasets: [{ data: [8, 32, 8], backgroundColor: ['#f59e0b', '#10b981', '#ef4444'], borderColor: '#1f2937', borderWidth: 2 }]
    },
    bar: {
      labels: ['Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16', 'Jul 17'],
      datasets: [{ label: 'Daily Bookings', data: [5, 8, 4, 11, 7, 9, 4], backgroundColor: 'rgba(20, 184, 166, 0.7)', borderColor: '#14b8a6', borderWidth: 1, borderRadius: 4 }]
    }
  });

  const [revenueChart, setRevenueChart] = useState({
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{ label: 'Revenue (INR)', data: [5400, 8900, 11200, 9800, 14200, 15400], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)', tension: 0.4, fill: true }]
  });

  const [parkingChart, setParkingChart] = useState({
    labels: ['Occupied', 'Available', 'Reserved'],
    datasets: [{ data: [32, 18, 0], backgroundColor: ['#f43f5e', '#10b981', '#3b82f6'], borderColor: '#1f2937', borderWidth: 2 }]
  });

  const [trafficChart, setTrafficChart] = useState({
    labels: ['Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16', 'Jul 17'],
    datasets: [{ label: 'Incidents Reported', data: [1, 3, 0, 2, 4, 1, 0], borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.15)', tension: 0.4, fill: true }]
  });

  // Map markers
  const [mapMarkers, setMapMarkers] = useState([
    { lat: 28.6304, lng: 77.2177, title: 'Central Junction (Connaught Place)', description: 'Sensor ID 1: Live traffic optimization active' },
    { lat: 28.6129, lng: 77.2295, title: 'East Highway Gate (India Gate)', description: 'Sensor ID 2: Connected to Dijkstra engine' },
    { lat: 28.6562, lng: 77.2410, title: 'Warehouse Area (Red Fort)', description: 'Automatic incident detection active' }
  ]);

  // Chart configuration memoized for optimized rendering
  const chartOptionsBase = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          font: { family: 'Outfit, Inter, system-ui', size: 11 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 8
      }
    },
    scales: {
      x: { grid: { color: '#1f2937', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10 } } },
      y: { grid: { color: '#1f2937', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10 } } }
    }
  }), []);

  const pieOptions = useMemo(() => ({
    ...chartOptionsBase,
    scales: { x: { display: false }, y: { display: false } }
  }), [chartOptionsBase]);

  // Fetch telemetry from live endpoints
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [kpiRes, bChartRes, rChartRes, pChartRes, tChartRes] = await Promise.allSettled([
        API.get('/dashboard/kpis'),
        API.get('/dashboard/bookings/chart'),
        API.get('/dashboard/revenue/chart'),
        API.get('/dashboard/parking/chart'),
        API.get('/dashboard/traffic/chart')
      ]);

      // Handle KPI Response
      if (kpiRes.status === 'fulfilled' && kpiRes.value.data) {
        const live = kpiRes.value.data;
        setKpis({
          bookings: live.bookings ?? 48,
          pendingBookings: live.pendingBookings ?? 8,
          approvedBookings: live.approvedBookings ?? 32,
          cancelledBookings: live.cancelledBookings ?? 8,
          users: live.users ?? 124,
          parking: live.parking ?? { total: 50, occupied: 32, available: 18 },
          trafficIncidents: live.trafficIncidents ?? 6,
          revenue: live.revenue ?? 15400
        });
      } else {
        console.warn('Dashboard KPIs loaded via fallback data.');
        setError('Using simulator telemetry fallback.');
      }

      // Handle Booking Charts
      if (bChartRes.status === 'fulfilled' && bChartRes.value.data) {
        const bData = bChartRes.value.data;
        if (bData.pie?.length > 0) {
          setBookingsChart(prev => ({
            ...prev,
            pie: {
              labels: bData.pie.map(item => item.label),
              datasets: [{
                data: bData.pie.map(item => item.value),
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6b7280'],
                borderColor: '#1f2937',
                borderWidth: 2
              }]
            }
          }));
        }
        if (bData.bar?.length > 0) {
          setBookingsChart(prev => ({
            ...prev,
            bar: {
              labels: bData.bar.map(item => item.date),
              datasets: [{
                label: 'Daily Bookings',
                data: bData.bar.map(item => item.count),
                backgroundColor: 'rgba(20, 184, 166, 0.7)',
                borderColor: '#14b8a6',
                borderWidth: 1,
                borderRadius: 4
              }]
            }
          }));
        }
      }

      // Handle Revenue Chart
      if (rChartRes.status === 'fulfilled' && rChartRes.value.data?.line?.length > 0) {
        const rData = rChartRes.value.data.line;
        setRevenueChart({
          labels: rData.map(item => item.month),
          datasets: [{
            label: 'Revenue (INR)',
            data: rData.map(item => item.amount),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            tension: 0.4,
            fill: true
          }]
        });
      }

      // Handle Parking Chart
      if (pChartRes.status === 'fulfilled' && pChartRes.value.data?.pie?.length > 0) {
        const pData = pChartRes.value.data.pie;
        setParkingChart({
          labels: pData.map(item => item.label),
          datasets: [{
            data: pData.map(item => item.value),
            backgroundColor: ['#f43f5e', '#10b981', '#3b82f6'],
            borderColor: '#1f2937',
            borderWidth: 2
          }]
        });
      }

      // Handle Traffic Incidents Chart
      if (tChartRes.status === 'fulfilled' && tChartRes.value.data?.area?.length > 0) {
        const tData = tChartRes.value.data.area;
        setTrafficChart({
          labels: tData.map(item => item.date),
          datasets: [{
            label: 'Incidents Reported',
            data: tData.map(item => item.count),
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            tension: 0.4,
            fill: true
          }]
        });
      }

      if (isSilent) {
        showToast('System telemetry synchronized successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (isSilent) {
        showToast('Failed to sync. Server is offline.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatINR = val => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return <LoadingScreen message="Loading live database metrics..." />;
  }

  return (
    <div className="space-y-8 pb-10">
      <SEO title="Admin Dashboard" description="Smart City management control center and live IoT sensor feed telemetry." />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkbg-card border border-darkbg-border rounded-2xl p-6 shadow-glass backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">System Telemetry Live</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-darkbg-textMuted text-xs mt-1 max-w-xl">
            Municipal operations terminal for {user?.name || 'Authorized Personnel'} (Role: <span className="text-brand-400 font-semibold">{user?.role || 'Operator'}</span>).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          {error && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] py-1.5 px-3 rounded-lg font-semibold max-w-xs leading-tight">
              ⚠️ Simulated Telemetry Fallback
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-darkbg-pure border border-darkbg-border hover:border-brand-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Telemetry'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Revenue */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{formatINR(kpis.revenue)}</h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>+12.4% from last week</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Bookings */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider">Total Bookings</span>
            <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{kpis.bookings}</h3>
            <p className="text-[10px] text-darkbg-textMuted flex items-center gap-1 mt-1 font-semibold">
              <span className="text-amber-500">{kpis.pendingBookings} Pending</span>
              <span>•</span>
              <span className="text-emerald-500">{kpis.approvedBookings} Approved</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Citizens */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider">Active Citizens</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{kpis.users}</h3>
            <p className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1 font-semibold">
              <ArrowUpRight className="h-3 w-3" />
              <span>+6 registrations today</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Parking Occupancy */}
        <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkbg-textMuted font-semibold uppercase tracking-wider">Smart Parking</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {kpis.parking.total - kpis.parking.available} / {kpis.parking.total}
            </h3>
            <p className="text-[10px] text-darkbg-textMuted flex items-center gap-1 mt-1 font-semibold">
              <span className="text-emerald-400">{kpis.parking.available} Slots Available</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChartCard
            title="Monthly Revenue Trajectory (Area Chart)"
            type="line"
            data={revenueChart}
            options={chartOptionsBase}
          />
          <ChartCard
            title="Municipal Booking Requests (Bar Chart)"
            type="bar"
            data={bookingsChart.bar}
            options={chartOptionsBase}
          />
        </div>
        <div className="space-y-8">
          <ChartCard
            title="Booking Processing Status (Pie Chart)"
            type="pie"
            data={bookingsChart.pie}
            options={pieOptions}
          />
          <ChartCard
            title="Parking Space Allocation Profile (Pie Chart)"
            type="pie"
            data={parkingChart}
            options={pieOptions}
          />
        </div>
      </div>

      {/* Real-time Map & Incident Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-400" />
              Live City Core Topology & Heatmap
            </h2>
            <span className="text-[10px] font-bold bg-darkbg-card border border-darkbg-border text-darkbg-textMuted px-2.5 py-1 rounded-full">
              New Delhi Central Grid
            </span>
          </div>
          <LeafletMap markers={mapMarkers} />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" />
              Incident Velocity
            </h2>
            <ChartCard
              title="Reported Traffic Incidents (Area Chart)"
              type="line"
              data={trafficChart}
              options={chartOptionsBase}
            />
          </div>

          <div className="bg-darkbg-card border border-darkbg-border rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-darkbg-border pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Active Municipal Alerts</span>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                {kpis.trafficIncidents} Active
              </span>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
              <div className="p-3 bg-darkbg-pure rounded-lg border border-darkbg-border flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Connaught Place Blockage</h4>
                  <p className="text-[10px] text-darkbg-textMuted mt-0.5">Heavy congestion due to localized utility repair.</p>
                </div>
              </div>
              <div className="p-3 bg-darkbg-pure rounded-lg border border-darkbg-border flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-white">India Gate Speed Restriction</h4>
                  <p className="text-[10px] text-darkbg-textMuted mt-0.5">VIP transit ongoing. Slower traffic recommended.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
