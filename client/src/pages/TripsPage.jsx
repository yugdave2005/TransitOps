import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import StatusBadge from '../components/common/StatusBadge';
import ViewToggle from '../components/common/ViewToggle';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import { getFriendlyErrorMessage } from '../lib/format';
import { ShieldCheck, Plus, Search, Filter, Truck, Users, MapPin, Calendar, CheckCircle, AlertTriangle, Play, CheckCircle2, XCircle } from 'lucide-react';

export default function TripsPage() {
  const { hasRole } = useAuth();
  const { subscribe } = useSocket();
  const { showToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, dispatched: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'table'
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Available Assets for Dispatch
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    vehicleId: '',
    driverId: '',
    origin: 'Mumbai Port (Nhava Sheva)',
    destination: 'Pune MIDC Hub',
    cargoWeight: 12000,
    scheduledDeparture: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    scheduledArrival: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16)
  });
  const [dispatchError, setDispatchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTripsAndMetrics = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const [tRes, mRes] = await Promise.all([
        api.get('/trips', { params }),
        api.get('/trips/metrics')
      ]);

      setTrips(tRes.data.trips);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  const fetchAvailableAssets = useCallback(async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/available'),
        api.get('/drivers', { params: { status: 'AVAILABLE' } })
      ]);
      setAvailableVehicles(vRes.data.vehicles);
      // Filter out any expired drivers just in case
      const validDrivers = dRes.data.drivers.filter(d => new Date(d.licenseExpiry) >= new Date() && d.safetyScore >= 70);
      setAvailableDrivers(validDrivers);

      if (vRes.data.vehicles.length > 0 && !dispatchForm.vehicleId) {
        setDispatchForm(prev => ({ ...prev, vehicleId: vRes.data.vehicles[0].id }));
      }
      if (validDrivers.length > 0 && !dispatchForm.driverId) {
        setDispatchForm(prev => ({ ...prev, driverId: validDrivers[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch available assets:', err);
    }
  }, [dispatchForm.vehicleId, dispatchForm.driverId]);

  useEffect(() => {
    fetchTripsAndMetrics();
  }, [fetchTripsAndMetrics]);

  // Real-time WebSocket subscriptions
  useEffect(() => {
    const unsub1 = subscribe('trip:updated', ({ action, trip }) => {
      fetchTripsAndMetrics();
    });
    const unsub2 = subscribe('trip:workerSync', () => {
      fetchTripsAndMetrics();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, fetchTripsAndMetrics]);

  const handleOpenDispatchModal = () => {
    setDispatchError('');
    fetchAvailableAssets();
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchError('');
    setIsSubmitting(true);
    try {
      await api.post('/trips', {
        vehicleId: dispatchForm.vehicleId,
        driverId: dispatchForm.driverId,
        origin: dispatchForm.origin,
        destination: dispatchForm.destination,
        cargoWeight: Number(dispatchForm.cargoWeight),
        scheduledDeparture: new Date(dispatchForm.scheduledDeparture).toISOString(),
        scheduledArrival: new Date(dispatchForm.scheduledArrival).toISOString()
      });

      showToast({
        type: 'success',
        title: 'Trip Dispatched',
        message: 'Pre-trip business rules verified. Vehicle and Driver status locked to ON_TRIP.'
      });
      setIsDispatchModalOpen(false);
      fetchTripsAndMetrics();
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.response?.data?.error || err.message);
      setDispatchError(friendlyMsg);
      showToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: friendlyMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (tripId, newStatus) => {
    try {
      await api.patch(`/trips/${tripId}/status`, { status: newStatus });
      showToast({
        type: newStatus === 'COMPLETED' ? 'success' : 'info',
        title: `Trip ${newStatus}`,
        message: newStatus === 'COMPLETED' ? 'Assets automatically released back to AVAILABLE.' : `Trip transitioned to ${newStatus}.`
      });
      fetchTripsAndMetrics();
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.response?.data?.error || err.message);
      showToast({
        type: 'error',
        title: 'Transition Failed',
        message: friendlyMsg
      });
    }
  };

  const selectedVehicleObj = availableVehicles.find(v => v.id === dispatchForm.vehicleId);
  const selectedDriverObj = availableDrivers.find(d => d.id === dispatchForm.driverId);
  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Trip Dispatching & Lifecycle Control</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Enforcing 10 pre-trip business rules: cargo capacity limits, driver compliance, and automatic AMQP asset locking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <ViewToggle view={view} onViewChange={setView} />
          {canManage && (
            <Button
              onClick={handleOpenDispatchModal}
              variant="primary"
              size="md"
              icon={Plus}
            >
              Dispatch New Trip
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Trips Logged" value={metrics.total} icon={ShieldCheck} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Active Dispatched" value={metrics.dispatched} icon={MapPin} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Currently En Route" value={metrics.inProgress} icon={Truck} borderLeft="border-l-status-orange" color="text-status-orange" />
        <KpiCard title="Successfully Delivered" value={metrics.completed} icon={CheckCircle2} borderLeft="border-l-status-green" color="text-status-green" />
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search trip code, origin, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-sm text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-border rounded-sm px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-primary"
            >
              <option value="">All Lifecycle Stages</option>
              <option value="DISPATCHED">Dispatched (Pending Start)</option>
              <option value="IN_PROGRESS">In Progress (En Route)</option>
              <option value="COMPLETED">Completed (Delivered)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-text-secondary font-mono">
          Showing <span className="font-bold text-text-primary">{trips.length}</span> trips
        </div>
      </div>

      {/* Trips Content */}
      {loading ? (
        <div className="p-12 text-center text-text-secondary text-sm">Loading active dispatch operations...</div>
      ) : trips.length === 0 ? (
        <div className="bg-background-panel border border-border p-12 text-center rounded-sm">
          <AlertTriangle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">No trips found matching active filters.</p>
        </div>
      ) : view === 'kanban' ? (
        /* Odoo Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trips.map((trip) => {
            return (
              <div
                key={trip.id}
                className={`bg-background-panel border rounded-sm p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-t-4 ${
                  trip.status === 'COMPLETED' ? 'border-t-status-green border-border' :
                  trip.status === 'IN_PROGRESS' ? 'border-t-status-orange border-border' :
                  trip.status === 'CANCELLED' ? 'border-t-status-red border-border' : 'border-t-status-blue border-border'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold tracking-tight text-primary">{trip.tripCode}</span>
                    <StatusBadge status={trip.status} />
                  </div>

                  <div className="mt-2 text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                    <span className="truncate">{trip.origin}</span>
                    <span className="text-text-muted">➔</span>
                    <span className="truncate">{trip.destination}</span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs text-text-secondary border-t border-border/60 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1"><Truck className="w-3 h-3 text-primary" /><span>Vehicle:</span></span>
                      <span className="font-mono font-bold text-text-primary">{trip.vehicle?.registrationNo || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1"><Users className="w-3 h-3 text-status-blue" /><span>Driver:</span></span>
                      <span className="font-semibold text-text-primary truncate max-w-[120px]">{trip.driver?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cargo Load:</span>
                      <span className="font-mono text-text-primary">{trip.cargoWeight} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Depart:</span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lifecycle Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end space-x-2">
                  {trip.status === 'DISPATCHED' && (
                    <>
                      <button
                        onClick={() => handleStatusTransition(trip.id, 'CANCELLED')}
                        className="text-xs text-status-red hover:bg-status-red/10 px-2 py-1 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={() => handleStatusTransition(trip.id, 'IN_PROGRESS')}
                        variant="primary"
                        size="sm"
                        icon={Play}
                      >
                        Start En Route
                      </Button>
                    </>
                  )}

                  {trip.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => handleStatusTransition(trip.id, 'COMPLETED')}
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      className="bg-status-green hover:bg-green-700"
                    >
                      Mark Completed
                    </Button>
                  )}

                  {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
                    <span className="text-[11px] font-mono text-text-muted italic">No further transitions</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Data Table View */
        <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Route (Origin ➔ Destination)</th>
                <th className="py-3 px-4">Assigned Truck</th>
                <th className="py-3 px-4">Assigned Driver</th>
                <th className="py-3 px-4 text-right">Cargo Weight</th>
                <th className="py-3 px-4">Scheduled Departure</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-primary">{trip.tripCode}</td>
                  <td className="py-2.5 px-4 font-medium text-text-primary">
                    {trip.origin} <span className="text-text-muted">➔</span> {trip.destination}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold">{trip.vehicle?.registrationNo}</td>
                  <td className="py-2.5 px-4">{trip.driver?.name}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{trip.cargoWeight} kg</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-text-muted">
                    {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={trip.status} />
                  </td>
                  <td className="py-2.5 px-4 text-right space-x-2">
                    {trip.status === 'DISPATCHED' && (
                      <>
                        <button onClick={() => handleStatusTransition(trip.id, 'CANCELLED')} className="text-status-red hover:underline font-medium">Cancel</button>
                        <button onClick={() => handleStatusTransition(trip.id, 'IN_PROGRESS')} className="bg-primary text-white px-2.5 py-1 rounded font-medium shadow-sm">Start</button>
                      </>
                    )}
                    {trip.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleStatusTransition(trip.id, 'COMPLETED')} className="bg-status-green text-white px-2.5 py-1 rounded font-medium shadow-sm">Complete</button>
                    )}
                    {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
                      <span className="text-text-muted font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispatch Trip Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Dispatch New Cargo Trip">

        <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Select Available Vehicle</label>
              <select
                required
                value={dispatchForm.vehicleId}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="" disabled>-- Select Truck --</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNo} ({v.type} | Max: {v.maxLoadCapacity} kg)
                  </option>
                ))}
              </select>
              {selectedVehicleObj && (
                <p className="mt-1 text-[10px] text-primary font-mono font-semibold">
                  Capacity: {selectedVehicleObj.maxLoadCapacity} kg | Odo: {selectedVehicleObj.odometer} km
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Select Compliant Driver</label>
              <select
                required
                value={dispatchForm.driverId}
                onChange={(e) => setDispatchForm({ ...dispatchForm, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="" disabled>-- Select Driver --</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.licenseCategory} | Score: {d.safetyScore}%)
                  </option>
                ))}
              </select>
              {selectedDriverObj && (
                <p className="mt-1 text-[10px] text-status-green font-mono font-semibold">
                  Exp: {new Date(selectedDriverObj.licenseExpiry).toLocaleDateString()} | Safety: {selectedDriverObj.safetyScore}/100
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Origin Hub</label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai Port (Nhava Sheva)"
                value={dispatchForm.origin}
                onChange={(e) => setDispatchForm({ ...dispatchForm, origin: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Destination Hub</label>
              <input
                type="text"
                required
                placeholder="e.g. Pune MIDC Hub"
                value={dispatchForm.destination}
                onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Cargo Weight (kg)</label>
              <input
                type="number"
                required
                min="1"
                value={dispatchForm.cargoWeight}
                onChange={(e) => setDispatchForm({ ...dispatchForm, cargoWeight: e.target.value })}
                className={`w-full px-3 py-2 border rounded-sm font-mono focus:outline-none ${
                  selectedVehicleObj && Number(dispatchForm.cargoWeight) > selectedVehicleObj.maxLoadCapacity
                    ? 'border-status-red bg-status-red/5 text-status-red font-bold'
                    : 'border-border focus:border-primary'
                }`}
              />
              {selectedVehicleObj && Number(dispatchForm.cargoWeight) > selectedVehicleObj.maxLoadCapacity && (
                <p className="mt-0.5 text-[10px] text-status-red font-bold">⚠️ Exceeds capacity by {Number(dispatchForm.cargoWeight) - selectedVehicleObj.maxLoadCapacity} kg</p>
              )}
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Scheduled Departure</label>
              <input
                type="datetime-local"
                required
                value={dispatchForm.scheduledDeparture}
                onChange={(e) => setDispatchForm({ ...dispatchForm, scheduledDeparture: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Scheduled Arrival</label>
              <input
                type="datetime-local"
                required
                value={dispatchForm.scheduledArrival}
                onChange={(e) => setDispatchForm({ ...dispatchForm, scheduledArrival: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 border border-border rounded-sm text-text-secondary hover:bg-black/5 font-medium transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Confirm & Dispatch Trip
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
