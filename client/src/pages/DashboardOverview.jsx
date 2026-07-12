import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatINR } from '../lib/format';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Truck, Users, MapPin, Wrench, ShieldCheck, DollarSign, Activity, ArrowRight, RefreshCw, AlertTriangle, Shield, CheckCircle2, Fuel, IndianRupee } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Driver specific
  const [driverData, setDriverData] = useState(null);
  const [driverTrip, setDriverTrip] = useState(null);
  const [driverLoading, setDriverLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (user?.role === 'DRIVER') return;
    try {
      setLoading(true);
      const res = await api.get('/reports/overview');
      setOverview(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard overview fetch failed:', err);
      showToast({ type: 'error', title: 'Data Load Failed', message: 'Could not load dashboard analytics.' });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const fetchDriverDashboard = useCallback(async () => {
    if (user?.role !== 'DRIVER') return;
    setDriverLoading(true);
    try {
      const [dRes, tRes] = await Promise.all([api.get('/drivers'), api.get('/trips')]);
      
      const cleanUserName = user.name ? user.name.replace(/\s*\([^)]+\)/g, '').trim().toLowerCase() : '';
      
      const matchingDriver = dRes.data.drivers.find(d => 
        d.name.replace(/\s*\([^)]+\)/g, '').trim().toLowerCase() === cleanUserName
      );
      if (matchingDriver) setDriverData(matchingDriver);
      
      const activeTrip = tRes.data.trips.find(t =>
        t.driver?.name?.replace(/\s*\([^)]+\)/g, '').trim().toLowerCase() === cleanUserName &&
        ['DISPATCHED', 'IN_PROGRESS'].includes(t.status)
      );
      setDriverTrip(activeTrip || null);
    } catch (err) {
      console.error('Driver dashboard fetch failed:', err);
      showToast({ type: 'error', title: 'Error', message: 'Failed to load driver details.' });
    } finally {
      setDriverLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user?.role === 'DRIVER') fetchDriverDashboard();
    else fetchOverview();
  }, [user, fetchOverview, fetchDriverDashboard]);

  useEffect(() => {
    if (user?.role === 'DRIVER') return;
    const unsub = subscribe('analytics:updated', ({ overview: liveData }) => {
      if (liveData) { setOverview(liveData); setLastUpdated(new Date()); }
    });
    return () => unsub();
  }, [subscribe, user]);

  // ─── DRIVER DASHBOARD ───
  if (user?.role === 'DRIVER') {
    if (driverLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-text-secondary space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-primary" />
          <span className="text-xs font-medium">Loading your driver dashboard...</span>
        </div>
      );
    }

    const isLicenseExpired = driverData && new Date(driverData.licenseExpiry) < new Date();
    const safetyColor = driverData?.safetyScore >= 90 ? 'text-status-green' : driverData?.safetyScore >= 75 ? 'text-status-blue' : 'text-status-orange';

    return (
      <div className="space-y-5">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary to-[#875A7B] text-white p-5 rounded shadow-md">
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-mono uppercase font-bold tracking-wider">Driver Portal</span>
          </div>
          <h1 className="text-xl font-bold">Welcome, {user?.name || 'Driver'}</h1>
          <p className="text-xs text-white/80 mt-0.5">View your assigned trips, safety score, and log fuel fill-ups.</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard title="Safety Rating" value={driverData?.safetyScore || 100} icon={ShieldCheck} color={safetyColor} borderLeft="border-l-status-green" />
          <KpiCard
            title="License Status"
            value={isLicenseExpired ? 'EXPIRED' : 'VALID'}
            icon={Users}
            color={isLicenseExpired ? 'text-status-red' : 'text-status-green'}
            borderLeft={isLicenseExpired ? 'border-l-status-red' : 'border-l-status-green'}
          />
        </div>

        {/* Active Trip */}
        <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
          <h3 className="font-bold text-sm text-text-primary mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Assigned Active Trip</span>
          </h3>
          {driverTrip ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background-page p-3 border border-border rounded text-xs">
                <div>
                  <div className="text-[9px] uppercase font-bold text-text-secondary">Trip Code</div>
                  <div className="font-mono font-bold text-primary mt-0.5">{driverTrip.tripCode}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-text-secondary">Origin</div>
                  <div className="font-semibold text-text-primary mt-0.5 truncate">{driverTrip.source || driverTrip.origin}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-text-secondary">Destination</div>
                  <div className="font-semibold text-text-primary mt-0.5 truncate">{driverTrip.destination}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold text-text-secondary">Cargo</div>
                  <div className="font-mono text-text-primary mt-0.5">{(driverTrip.cargoWeight || 0).toLocaleString('en-IN')} kg</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={driverTrip.status} />
                <button onClick={() => navigate('/trips')} className="text-[11px] text-primary font-semibold hover:underline flex items-center space-x-1">
                  <span>Manage Trip</span><ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Shield className="w-8 h-8 text-text-muted mx-auto" />
              <div className="font-bold text-xs text-text-primary">No Active Trip Assigned</div>
              <p className="text-[11px] text-text-secondary">You are on standby. A dispatcher will assign trips when available.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/fuel')} className="p-3 bg-background-panel border border-border rounded hover:border-primary hover:shadow text-left transition-all group">
            <div className="font-bold text-xs text-text-primary group-hover:text-primary">Log Fuel Fill-Up</div>
            <div className="text-[10px] text-text-secondary mt-0.5">Record fuel and odometer</div>
          </button>
          <button onClick={() => navigate('/trips')} className="p-3 bg-background-panel border border-border rounded hover:border-primary hover:shadow text-left transition-all group">
            <div className="font-bold text-xs text-text-primary group-hover:text-primary">Trip History</div>
            <div className="text-[10px] text-text-secondary mt-0.5">View completed trips</div>
          </button>
        </div>
      </div>
    );
  }

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-text-secondary space-y-3">
        <RefreshCw className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-medium">Loading dashboard analytics...</span>
      </div>
    );
  }

  if (!overview) return null;

  const { kpi, fleetStatus, expenseBreakdown, safetyLeaders, dailyTrend } = overview;
  const isFinance = user?.role === 'FINANCIAL_ANALYST';
  const isSafety = user?.role === 'SAFETY_OFFICER';

  // ─── FINANCIAL ANALYST DASHBOARD ───
  if (isFinance) {
    const totalExp = kpi?.totalExpenses || 0;
    const fuelExp = expenseBreakdown?.find(e => e.category === 'FUEL')?.amount || 0;

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-primary to-[#875A7B] text-white p-5 rounded shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-mono uppercase font-bold tracking-wider">Financial Analyst</span>
              <span className="text-[10px] text-white/70 font-mono">Synced: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <h1 className="text-xl font-bold">Financial Dashboard</h1>
            <p className="text-xs text-white/80 mt-0.5">Expense analysis, fuel cost tracking, and category breakdowns.</p>
          </div>
          <button onClick={fetchOverview} className="p-2 bg-white/10 hover:bg-white/20 rounded text-white" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="Total Fleet" value={kpi?.totalVehicles || 0} icon={Truck} borderLeft="border-l-primary" color="text-primary" onClick={() => navigate('/vehicles')} />
          <KpiCard title="Total Expenditure" value={formatINR(totalExp)} icon={IndianRupee} borderLeft="border-l-status-green" color="text-status-green" onClick={() => navigate('/expenses')} />
          <KpiCard title="Fuel Costs" value={formatINR(fuelExp)} icon={Fuel} borderLeft="border-l-status-blue" color="text-status-blue" onClick={() => navigate('/fuel')} />
          <KpiCard title="Other Costs" value={formatINR(totalExp - fuelExp)} icon={DollarSign} borderLeft="border-l-status-orange" color="text-status-orange" onClick={() => navigate('/expenses')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
            <h3 className="font-bold text-xs text-text-primary mb-3 pb-2 border-b border-border flex items-center space-x-2">
              <IndianRupee className="w-4 h-4 text-status-green" /><span>Expense Category Breakdown</span>
            </h3>
            <div className="h-56">
              {expenseBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdown} margin={{ top: 5, right: 5, left: 0, bottom: 15 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <RechartsTooltip formatter={(val) => [formatINR(val), 'Amount']} />
                    <Bar dataKey="amount" fill="#714B67" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-xs text-text-muted">No data</div>}
            </div>
          </div>

          <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
            <h3 className="font-bold text-xs text-text-primary mb-3 pb-2 border-b border-border flex items-center space-x-2">
              <Activity className="w-4 h-4 text-status-blue" /><span>14-Day Expenditure Trend</span>
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <RechartsTooltip formatter={(val) => [formatINR(val)]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="fuel" name="Fuel (₹)" stackId="a" fill="#007bff" />
                  <Bar dataKey="expenses" name="Other (₹)" stackId="a" fill="#714B67" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/expenses')} className="p-3 bg-background-panel border border-border rounded hover:border-primary text-center transition-all text-xs font-bold text-text-primary hover:text-primary">Log Expense</button>
          <button onClick={() => navigate('/fuel')} className="p-3 bg-background-panel border border-border rounded hover:border-primary text-center transition-all text-xs font-bold text-text-primary hover:text-primary">Audit Fuel Logs</button>
          <button onClick={() => navigate('/reports')} className="p-3 bg-background-panel border border-border rounded hover:border-primary text-center transition-all text-xs font-bold text-text-primary hover:text-primary">Export Reports</button>
        </div>
      </div>
    );
  }

  // ─── FLEET MANAGER / SAFETY OFFICER DASHBOARD ───
  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-[#875A7B] text-white p-5 rounded shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-mono uppercase font-bold tracking-wider">
              {isSafety ? 'Safety Officer' : 'Fleet Manager'}
            </span>
            <span className="text-[10px] text-white/70 font-mono">Synced: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <h1 className="text-xl font-bold">Welcome, {user?.name || 'Manager'}</h1>
          <p className="text-xs text-white/80 mt-0.5">Fleet operations, trip dispatching, and asset management.</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isSafety && (
            <button onClick={() => navigate('/tracking')} className="px-3 py-1.5 bg-white text-primary rounded text-xs font-bold hover:bg-white/90 shadow flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5" /><span>Live Map</span>
            </button>
          )}
          <button onClick={fetchOverview} className="p-2 bg-white/10 hover:bg-white/20 rounded text-white" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* KPI Row */}
      <div className={`grid gap-3 ${isSafety ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        <KpiCard title="Total Fleet" value={kpi.totalVehicles} icon={Truck} borderLeft="border-l-primary" color="text-primary" onClick={() => navigate('/vehicles')} />
        <KpiCard title="En Route" value={kpi.activeEnRoute} icon={Activity} borderLeft="border-l-status-blue" color="text-status-blue" onClick={() => navigate('/tracking')} />
        <KpiCard title="In Shop" value={kpi.inShopCount} icon={Wrench} borderLeft="border-l-status-orange" color="text-status-orange" onClick={() => navigate('/maintenance')} />
        <KpiCard title="Trips Dispatched" value={kpi.totalTrips} icon={ShieldCheck} borderLeft="border-l-status-green" color="text-status-green" onClick={() => navigate('/trips')} />
        {!isSafety && (
          <>
            <KpiCard title="On-Time Rate" value={`${kpi.onTimeRate}%`} icon={CheckCircle2} borderLeft="border-l-primary" color="text-primary" />
            <KpiCard title="Total Spend" value={formatINR(kpi.totalExpenses)} icon={IndianRupee} borderLeft="border-l-status-green" color="text-status-green" onClick={() => navigate('/expenses')} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className={`grid gap-5 ${isSafety ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Fleet Distribution Pie */}
        <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h3 className="font-bold text-xs text-text-primary flex items-center space-x-2">
              <Truck className="w-4 h-4 text-primary" /><span>Fleet Status Distribution</span>
            </h3>
            <span className="text-[10px] font-mono text-text-secondary">Total: {kpi.totalVehicles}</span>
          </div>
          <div className="h-56">
            {kpi.totalVehicles === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">No vehicles registered</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fleetStatus.filter(f => f.count > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="name">

                    {fleetStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Breakdown (hidden for safety officer) */}
        {!isSafety && (
          <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="font-bold text-xs text-text-primary flex items-center space-x-2">
                <IndianRupee className="w-4 h-4 text-status-green" /><span>Expense Breakdown</span>
              </h3>
            </div>
            <div className="h-56">
              {expenseBreakdown?.every(e => e.amount === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">No expenses logged</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdown} margin={{ top: 5, right: 5, left: 0, bottom: 15 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <RechartsTooltip formatter={(val) => [formatINR(val), 'Amount']} />
                    <Bar dataKey="amount" fill="#714B67" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Trend + Safety */}
      <div className={`grid gap-5 ${isSafety ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {!isSafety && (
          <div className="lg:col-span-2 bg-background-panel border border-border p-4 rounded shadow-sm">
            <h3 className="font-bold text-xs text-text-primary mb-3 pb-2 border-b border-border flex items-center space-x-2">
              <Activity className="w-4 h-4 text-status-blue" /><span>14-Day Expenditure Trend</span>
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <RechartsTooltip formatter={(val) => [formatINR(val)]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="fuel" name="Fuel (₹)" stackId="a" fill="#007bff" />
                  <Bar dataKey="expenses" name="Other (₹)" stackId="a" fill="#714B67" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Safety Leaderboard */}
        <div className="bg-background-panel border border-border p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h3 className="font-bold text-xs text-text-primary flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-status-green" /><span>Safety Leaderboard</span>
            </h3>
            <button onClick={() => navigate('/drivers')} className="text-[10px] text-primary hover:underline font-semibold flex items-center space-x-0.5">
              <span>View All</span><ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {safetyLeaders?.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6">No drivers found</div>
            ) : (
              safetyLeaders?.map((driver, idx) => {
                const sc = driver.safetyScore >= 90 ? 'text-status-green' : driver.safetyScore >= 75 ? 'text-status-blue' : 'text-status-orange';
                return (
                  <button key={driver.id} onClick={() => navigate('/drivers')} className="w-full flex items-center justify-between p-2 rounded bg-background-page border border-border/80 text-xs hover:border-primary transition-colors text-left">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-[9px]">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-text-primary">{driver.name}</div>
                        <div className="text-[9px] text-text-muted font-mono">{driver.licenseNo}</div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${sc}`}>{driver.safetyScore}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => navigate('/trips')} className="p-3 bg-background-panel border border-border rounded hover:border-primary hover:shadow text-left transition-all group">
          <div className="font-bold text-xs text-text-primary group-hover:text-primary">Dispatch Trip</div>
          <div className="text-[10px] text-text-secondary mt-0.5">Validate & assign</div>
        </button>
        <button onClick={() => navigate('/maintenance')} className="p-3 bg-background-panel border border-border rounded hover:border-status-orange hover:shadow text-left transition-all group">
          <div className="font-bold text-xs text-text-primary group-hover:text-status-orange">Shop Check-In</div>
          <div className="text-[10px] text-text-secondary mt-0.5">Lock vehicle status</div>
        </button>
        <button onClick={() => navigate('/fuel')} className="p-3 bg-background-panel border border-border rounded hover:border-status-blue hover:shadow text-left transition-all group">
          <div className="font-bold text-xs text-text-primary group-hover:text-status-blue">Log Fuel</div>
          <div className="text-[10px] text-text-secondary mt-0.5">Odometer enforcement</div>
        </button>
        <button onClick={() => navigate('/reports')} className="p-3 bg-background-panel border border-border rounded hover:border-status-green hover:shadow text-left transition-all group">
          <div className="font-bold text-xs text-text-primary group-hover:text-status-green">Export Reports</div>
          <div className="text-[10px] text-text-secondary mt-0.5">CSV / JSON summaries</div>
        </button>
      </div>
    </div>
  );
}
