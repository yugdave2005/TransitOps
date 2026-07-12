import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import FleetMap from '../components/tracking/FleetMap';
import VehicleDetailDrawer from '../components/tracking/VehicleDetailDrawer';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import { Navigation, Play, Square, Search, Filter, Truck, Gauge, Compass, ShieldCheck, RefreshCw } from 'lucide-react';

export default function TrackingPage() {
  const { hasRole } = useAuth();
  const { subscribe } = useSocket();
  const { showToast } = useToast();

  const [telemetryList, setTelemetryList] = useState([]);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toggling, setToggling] = useState(false);

  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const res = await api.get('/tracking/live');
      setTelemetryList(res.data.telemetry || []);
      setIsSimulatorRunning(res.data.isRunning);

      // Keep selected vehicle synced with latest GPS data if open
      if (selectedVehicle) {
        const updated = (res.data.telemetry || []).find(v => (v.vehicleId === selectedVehicle.vehicleId || v.id === selectedVehicle.id));
        if (updated) setSelectedVehicle(updated);
      }
    } catch (err) {
      console.error('Failed to fetch live telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetchLiveTelemetry();
  }, [fetchLiveTelemetry]);

  // Listen to live WebSocket telemetry broadcasts (fired every ~3s by simulator / worker)
  useEffect(() => {
    const unsub = subscribe('vehicle:telemetry', ({ telemetry }) => {
      if (Array.isArray(telemetry)) {
        setTelemetryList(telemetry);
        if (selectedVehicle) {
          const updated = telemetry.find(v => (v.vehicleId === selectedVehicle.vehicleId || v.id === selectedVehicle.id));
          if (updated) setSelectedVehicle(updated);
        }
      }
    });

    return () => unsub();
  }, [subscribe, selectedVehicle]);

  const handleToggleSimulator = async () => {
    setToggling(true);
    try {
      const res = await api.post('/tracking/simulate/toggle', { action: 'toggle' });
      setIsSimulatorRunning(res.data.isRunning);
      showToast({
        type: res.data.isRunning ? 'success' : 'info',
        title: res.data.isRunning ? 'GPS Simulation Active' : 'Simulation Paused',
        message: res.data.message
      });
      fetchLiveTelemetry();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Toggle Failed',
        message: err.response?.data?.error || 'Failed to toggle telemetry simulator.'
      });
    } finally {
      setToggling(false);
    }
  };

  const handleQuickAction = async (vehicleId, newStatus) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/status`, { status: newStatus });
      showToast({
        type: 'success',
        title: 'Fleet Status Updated',
        message: `Vehicle transitioned to ${newStatus}.`
      });
      fetchLiveTelemetry();
      if (selectedVehicle) {
        setSelectedVehicle(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.error || 'Failed to update vehicle status.'
      });
    }
  };

  // Filtered telemetry list
  const filteredVehicles = telemetryList.filter(v => {
    if (statusFilter && v.status !== statusFilter) return false;
    if (searchQuery && !v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const totalVehicles = telemetryList.length;
  const activeEnRoute = telemetryList.filter(v => v.status === 'ON_TRIP').length;
  const avgSpeed = activeEnRoute > 0
    ? Math.round(telemetryList.filter(v => v.status === 'ON_TRIP').reduce((acc, curr) => acc + (curr.speed || 0), 0) / activeEnRoute)
    : 0;

  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Top Title & Telemetry Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-primary" />
            <span>OpenStreetMap Real-Time Fleet Telemetry</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Continuous GPS interpolation along major Indian transit corridors (Mumbai ➔ Pune, Delhi ➔ Jaipur, Bangalore ➔ Chennai).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Simulator Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-background-page border border-border rounded-sm text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isSimulatorRunning ? 'bg-status-green animate-ping' : 'bg-text-muted'}`}></span>
            <span className="font-mono font-bold text-text-primary">
              {isSimulatorRunning ? 'LIVE SIMULATOR (3s LOOP)' : 'SIMULATOR PAUSED'}
            </span>
          </div>

          {canManage && (
            <Button
              onClick={handleToggleSimulator}
              variant={isSimulatorRunning ? 'danger' : 'primary'}
              size="sm"
              icon={isSimulatorRunning ? Square : Play}
              isLoading={toggling}
            >
              {isSimulatorRunning ? 'Stop GPS Loop' : 'Start GPS Loop'}
            </Button>
          )}

          <button
            onClick={fetchLiveTelemetry}
            className="p-1.5 border border-border rounded-sm hover:bg-black/5 text-text-secondary transition-colors"
            title="Refresh Snapshot"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI & Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-shrink-0">
        <KpiCard title="Tracked Fleet Size" value={totalVehicles} icon={Truck} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Active En Route Pulse" value={activeEnRoute} icon={Navigation} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Avg Transit Speed" value={`${avgSpeed} km/h`} icon={Gauge} borderLeft="border-l-status-green" color="text-status-green" />

        {/* Filter Widget */}
        <div className="bg-background-panel border border-border p-3 rounded-sm flex flex-col justify-center space-y-2">
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search truck reg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border-b border-border focus:border-primary focus:outline-none py-0.5"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary flex items-center space-x-1"><Filter className="w-3 h-3" /><span>Status:</span></span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded text-[11px] px-1.5 py-0.5 bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ON_TRIP">On Trip (Moving)</option>
              <option value="AVAILABLE">Available (Depot)</option>
              <option value="IN_SHOP">In Shop</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Slide Drawer Container */}
      <div className="relative flex-1 w-full min-h-[350px] rounded-sm overflow-hidden border border-border shadow-md">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-background-panel text-text-secondary text-sm">
            Initializing OpenStreetMap tiles and GPS sensors...
          </div>
        ) : (
          <>
            <FleetMap
              vehicles={filteredVehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />

            <VehicleDetailDrawer
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
              onQuickAction={canManage ? handleQuickAction : null}
            />
          </>
        )}
      </div>
    </div>
  );
}
