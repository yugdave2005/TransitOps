import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Truck, Users, MapPin, Wrench, ShieldCheck, DollarSign, Activity, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.get('/reports/overview');
      setOverview(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Listen for real-time analytics updates from analytics.worker.js (broadcasted every 15s)
  useEffect(() => {
    const unsub = subscribe('analytics:updated', ({ overview: liveData }) => {
      if (liveData) {
        setOverview(liveData);
        setLastUpdated(new Date());
      }
    });
    return () => unsub();
  }, [subscribe]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-text-secondary space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Aggregating real-time telemetry and ERP analytics...</span>
      </div>
    );
  }

  if (!overview) return null;

  const { kpi, fleetStatus, expenseBreakdown, tripMetrics, safetyLeaders, dailyTrend } = overview;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary to-[#875A7B] text-white p-5 rounded-sm shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-mono tracking-wider uppercase font-bold">
              LIVE COMMAND CENTER
            </span>
            <span className="text-xs text-white/80 font-mono">
              Last Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name || 'Commander'}</h1>
          <p className="text-xs text-white/90 max-w-xl mt-0.5">
            Real-time fleet state orchestration across India transit corridors. Asset interlocks, GPS interpolation loops, and accounting ledgers active.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/tracking')}
            className="px-3.5 py-2 bg-white text-primary rounded-sm font-bold text-xs hover:bg-white/90 transition-all shadow flex items-center space-x-1.5"
          >
            <MapPin className="w-4 h-4 text-status-blue" />
            <span>Open Live Fleet Map</span>
          </button>
          <button
            onClick={fetchOverview}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-sm text-white transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Fleet Size" value={kpi.totalVehicles} icon={Truck} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Active En Route" value={kpi.activeEnRoute} icon={Activity} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Locked In Shop" value={kpi.inShopCount} icon={Wrench} borderLeft="border-l-status-orange" color="text-status-orange" />
        <KpiCard title="Total Dispatched" value={kpi.totalTrips} icon={ShieldCheck} borderLeft="border-l-status-green" color="text-status-green" />
        <KpiCard title="On-Time Rate" value={`${kpi.onTimeRate}%`} icon={Truck} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Total Expenditure" value={`$${kpi.totalExpenses.toLocaleString()}`} icon={DollarSign} borderLeft="border-l-status-green" color="text-status-green" />
      </div>

      {/* Charts Grid Row 1: Fleet Status & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Asset Distribution Pie Chart */}
        <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center space-x-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>Fleet Asset Distribution (`Rule 2` Statuses)</span>
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">Total: {kpi.totalVehicles} Trucks</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {kpi.totalVehicles === 0 ? (
              <div className="text-xs text-text-muted italic">No vehicles registered in fleet yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetStatus.filter(f => f.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {fleetStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => [`${val} Vehicles`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operational Cost Category Breakdown Bar Chart */}
        <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-status-green" />
              <span>Operational Expense Breakdown by Category</span>
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">All Ledgers</span>
          </div>

          <div className="h-64 w-full">
            {expenseBreakdown.every(e => e.amount === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted italic">No operational expenses logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="$" />
                  <RechartsTooltip formatter={(val) => [`$${val}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#714B67" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: 14-Day Daily Expenditure Trend & Safety Score Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Daily Expenditure Trend */}
        <div className="lg:col-span-2 bg-background-panel border border-border p-4 rounded-sm shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center space-x-2">
              <Activity className="w-4 h-4 text-status-blue" />
              <span>14-Day Operational Expenditure Trend (Fuel vs General Expenses)</span>
            </h3>
            <span className="text-[11px] font-mono text-text-secondary">Daily Aggregation ($)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="fuel" name="Fuel Fill-Ups ($)" stackId="a" fill="#007bff" />
                <Bar dataKey="expenses" name="Other Ledgers ($)" stackId="a" fill="#714B67" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Driver Safety Leaderboard */}
        <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="font-bold text-text-primary text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-status-green" />
              <span>Top Driver Safety Scoreboard</span>
            </h3>
            <button onClick={() => navigate('/drivers')} className="text-[11px] text-primary hover:underline font-semibold flex items-center space-x-0.5">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {safetyLeaders.length === 0 ? (
              <div className="text-xs text-text-muted italic text-center py-8">No active drivers found.</div>
            ) : (
              safetyLeaders.map((driver, idx) => {
                const scoreColor = driver.safetyScore >= 90 ? 'text-status-green' : driver.safetyScore >= 75 ? 'text-status-blue' : 'text-status-orange';
                return (
                  <div key={driver.id} className="flex items-center justify-between p-2 rounded bg-background-page border border-border/80 text-xs hover:border-primary transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-text-primary">{driver.name}</div>
                        <div className="text-[10px] text-text-muted font-mono">{driver.licenseNo}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${scoreColor}`}>{driver.safetyScore}</div>
                      <div className="text-[9px] uppercase tracking-wider text-text-secondary">Safety Index</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <h3 className="font-bold text-text-primary text-sm mb-3">Quick Operational Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/trips')}
            className="p-3 bg-background-page border border-border rounded-sm hover:border-primary hover:shadow-sm text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-text-primary group-hover:text-primary">Dispatch New Trip</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Validate license & state locks</div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => navigate('/maintenance')}
            className="p-3 bg-background-page border border-border rounded-sm hover:border-status-orange hover:shadow-sm text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-text-primary group-hover:text-status-orange">Check Into Shop</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Auto-lock IN_SHOP status</div>
            </div>
            <Wrench className="w-4 h-4 text-text-muted group-hover:text-status-orange" />
          </button>

          <button
            onClick={() => navigate('/fuel')}
            className="p-3 bg-background-page border border-border rounded-sm hover:border-status-blue hover:shadow-sm text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-text-primary group-hover:text-status-blue">Log Fuel Fill-Up</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Enforce odometer progression</div>
            </div>
            <DollarSign className="w-4 h-4 text-text-muted group-hover:text-status-blue" />
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="p-3 bg-background-page border border-border rounded-sm hover:border-status-green hover:shadow-sm text-left transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-xs text-text-primary group-hover:text-status-green">Export Executive Reports</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Download CSV / JSON summaries</div>
            </div>
            <Activity className="w-4 h-4 text-text-muted group-hover:text-status-green" />
          </button>
        </div>
      </div>
    </div>
  );
}
