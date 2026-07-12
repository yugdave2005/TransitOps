import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import StatusBadge from '../components/common/StatusBadge';
import ViewToggle from '../components/common/ViewToggle';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import { formatINR } from '../lib/format';
import { vehicleSchema, validate } from '../lib/validators';
import { Truck, Plus, Search, Filter, AlertCircle, Trash2, MapPin, Gauge } from 'lucide-react';

export default function VehiclesPage() {
  const { hasRole } = useAuth();
  const { subscribe } = useSocket();

  const [vehicles, setVehicles] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, available: 0, onTrip: 0, inShop: 0, retired: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'table'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    registrationNo: '',
    name: '',
    type: 'TRUCK',
    maxLoadCapacity: 15000,
    odometer: 0,
    acquisitionCost: 2500000,
    status: 'AVAILABLE',
    region: 'North'
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast } = useToast();

  const fetchVehicles = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (searchQuery) params.search = searchQuery;

      const [vRes, mRes] = await Promise.all([
        api.get('/vehicles', { params }),
        api.get('/vehicles/metrics')
      ]);

      setVehicles(vRes.data.vehicles);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, searchQuery]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Real-time WebSocket subscriptions
  useEffect(() => {
    const unsub1 = subscribe('vehicle:updated', () => {
      fetchVehicles();
    });
    const unsub2 = subscribe('vehicle:statusChange', ({ vehicleId, status }) => {
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status } : v));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, fetchVehicles]);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    const { success, errors } = validate(vehicleSchema, {
      registrationNo: formData.registrationNo.toUpperCase(),
      name: formData.name,
      type: formData.type,
      maxLoadCapacity: Number(formData.maxLoadCapacity),
      odometer: Number(formData.odometer),
      region: formData.region,
      status: formData.status,
    });
    if (!success) { setFieldErrors(errors); return; }

    try {
      await api.post('/vehicles', {
        ...formData,
        maxLoadCapacity: Number(formData.maxLoadCapacity),
        odometer: Number(formData.odometer),
        acquisitionCost: Number(formData.acquisitionCost)
      });
      setIsModalOpen(false);
      setFormData({ registrationNo: '', name: '', type: 'TRUCK', maxLoadCapacity: 15000, odometer: 0, acquisitionCost: 2500000, status: 'AVAILABLE', region: 'North' });
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create vehicle.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/vehicles/${id}/status`, { status: newStatus });
      showToast({ type: 'success', title: 'Status Updated', message: `Vehicle transitioned to ${newStatus}.` });
      fetchVehicles();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.response?.data?.error || 'Failed to update status.' });
    }
  };

  const handleDelete = async (id, regNo) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${regNo}?`)) return;
    try {
      await api.delete(`/vehicles/${id}`);
      showToast({ type: 'success', title: 'Vehicle Deleted', message: `${regNo} removed from fleet.` });
      fetchVehicles();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.response?.data?.error || 'Failed to delete vehicle.' });
    }
  };

  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <Truck className="w-5 h-5 text-primary" />
            <span>Vehicle Registry & Status Lifecycle</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Manage fleet assets, monitor live status, and control operational capacities.</p>
        </div>

        <div className="flex items-center space-x-3">
          <ViewToggle view={view} onViewChange={setView} />
          
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium px-3.5 py-2 rounded-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Assets" value={metrics.total} icon={Truck} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Available Fleet" value={metrics.available} icon={Truck} borderLeft="border-l-status-green" color="text-status-green" />
        <KpiCard title="Active On Trip" value={metrics.onTrip} icon={Truck} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="In Shop / Maintenance" value={metrics.inShop} icon={Truck} borderLeft="border-l-status-orange" color="text-status-orange" />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search registration no or model..."
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
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-border rounded-sm px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="BUS">Bus</option>
              <option value="CAR">Car</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-text-secondary font-mono">
          Showing <span className="font-bold text-text-primary">{vehicles.length}</span> records
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="p-12 text-center text-text-secondary text-sm">Loading vehicle registry...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-background-panel border border-border p-12 text-center rounded-sm">
          <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">No vehicles found matching criteria.</p>
        </div>
      ) : view === 'kanban' ? (
        /* Odoo Kanban Board View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-background-panel border border-border rounded-sm p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-t-4 border-t-primary">
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm font-bold tracking-tight text-primary">{vehicle.registrationNo}</span>
                  <StatusBadge status={vehicle.status} />
                </div>

                <h3 className="font-bold text-sm text-text-primary mt-1.5 line-clamp-1">{vehicle.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <span className="font-semibold text-text-primary">{vehicle.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max Capacity:</span>
                    <span className="font-mono text-text-primary font-semibold">{vehicle.maxLoadCapacity.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1"><Gauge className="w-3 h-3" /><span>Odometer:</span></span>
                    <span className="font-mono text-text-primary">{vehicle.odometer.toLocaleString()} km</span>
                  </div>
                  {vehicle.region && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1"><MapPin className="w-3 h-3" /><span>Region:</span></span>
                      <span className="text-text-primary">{vehicle.region}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Status Toggles & Delete */}
              {canManage && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                    className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background-page text-text-primary font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="IN_SHOP">In Shop</option>
                    <option value="RETIRED">Retired</option>
                  </select>

                  {hasRole('FLEET_MANAGER') && (
                    <button
                      onClick={() => handleDelete(vehicle.id, vehicle.registrationNo)}
                      className="text-text-muted hover:text-status-red p-1 rounded transition-colors"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Odoo Dense Data Table View */
        <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Registration No</th>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Max Load (kg)</th>
                <th className="py-3 px-4 text-right">Odometer (km)</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-primary">{vehicle.registrationNo}</td>
                  <td className="py-2.5 px-4 font-medium text-text-primary">{vehicle.name}</td>
                  <td className="py-2.5 px-4">{vehicle.type}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{vehicle.maxLoadCapacity.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{vehicle.odometer.toLocaleString()}</td>
                  <td className="py-2.5 px-4">{vehicle.region || '—'}</td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  {canManage && (
                    <td className="py-2.5 px-4 text-right space-x-2">
                      <select
                        value={vehicle.status}
                        onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                        className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background-page text-text-primary"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="IN_SHOP">In Shop</option>
                        <option value="RETIRED">Retired</option>
                      </select>

                      {hasRole('FLEET_MANAGER') && (
                        <button
                          onClick={() => handleDelete(vehicle.id, vehicle.registrationNo)}
                          className="text-text-muted hover:text-status-red transition-colors inline-block align-middle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Vehicle Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Vehicle Asset">
        {formError && (
          <div className="bg-status-red/10 border border-status-red text-status-red text-xs p-3 rounded-sm mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Registration No</label>
              <input
                type="text"
                required
                placeholder="e.g. KA-01-AB-1234"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono uppercase focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="TRUCK">Truck</option>
                <option value="VAN">Van</option>
                <option value="BUS">Bus</option>
                <option value="CAR">Car</option>
                <option value="MOTORCYCLE">Motorcycle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Model Name / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Tata Signo 4825.T Heavy Truck"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Max Load Capacity (kg)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxLoadCapacity}
                onChange={(e) => setFormData({ ...formData, maxLoadCapacity: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Initial Odometer (km)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Region / Depot</label>
              <input
                type="text"
                placeholder="e.g. North, South, West"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_SHOP">In Shop</option>
                <option value="ON_TRIP">On Trip</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border rounded-sm text-text-secondary hover:bg-black/5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-sm font-medium shadow-sm transition-colors"
            >
              Register Asset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
