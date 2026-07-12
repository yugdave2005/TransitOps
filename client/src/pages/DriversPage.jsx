import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import ViewToggle from '../components/common/ViewToggle';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import { Users, Plus, Search, Filter, AlertTriangle, ShieldCheck, Trash2, Phone, Calendar } from 'lucide-react';

export default function DriversPage() {
  const { hasRole } = useAuth();
  const { subscribe } = useSocket();

  const [drivers, setDrivers] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, available: 0, onTrip: 0, offDuty: 0, suspended: 0, expiredCount: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'table'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'CE (Heavy Trailer)',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    contactNumber: '+91 ',
    safetyScore: 100,
    status: 'AVAILABLE'
  });
  const [formError, setFormError] = useState('');

  const fetchDrivers = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.licenseCategory = filterCategory;
      if (searchQuery) params.search = searchQuery;

      const [dRes, mRes] = await Promise.all([
        api.get('/drivers', { params }),
        api.get('/drivers/metrics')
      ]);

      setDrivers(dRes.data.drivers);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, searchQuery]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Real-time WebSocket subscriptions
  useEffect(() => {
    const unsub1 = subscribe('driver:updated', () => {
      fetchDrivers();
    });
    const unsub2 = subscribe('driver:statusChange', ({ driverId, status, safetyScore }) => {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status, ...(safetyScore !== undefined && { safetyScore }) } : d));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, fetchDrivers]);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/drivers', {
        ...formData,
        safetyScore: Number(formData.safetyScore)
      });
      setIsModalOpen(false);
      setFormData({ name: '', licenseNumber: '', licenseCategory: 'CE (Heavy Trailer)', licenseExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0], contactNumber: '+91 ', safetyScore: 100, status: 'AVAILABLE' });
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create driver.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/drivers/${id}/status`, { status: newStatus });
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete driver ${name}?`)) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete driver.');
    }
  };

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();
  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Driver Profiles & Compliance Tracking</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Track licenses, validate safety scores, and enforce pre-trip compliance.</p>
        </div>

        <div className="flex items-center space-x-3">
          <ViewToggle view={view} onViewChange={setView} />
          
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium px-3.5 py-2 rounded-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Driver</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Drivers" value={metrics.total} icon={Users} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Available On Duty" value={metrics.available} icon={ShieldCheck} borderLeft="border-l-status-green" color="text-status-green" />
        <KpiCard title="Active On Trip" value={metrics.onTrip} icon={Users} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Expired / Suspended" value={(metrics.suspended || 0) + (metrics.expiredCount || 0)} icon={AlertTriangle} borderLeft="border-l-status-red" color="text-status-red" />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search driver name or license..."
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
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-text-secondary font-mono">
          Showing <span className="font-bold text-text-primary">{drivers.length}</span> records
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="p-12 text-center text-text-secondary text-sm">Loading driver compliance directory...</div>
      ) : drivers.length === 0 ? (
        <div className="bg-background-panel border border-border p-12 text-center rounded-sm">
          <AlertTriangle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">No driver profiles found matching criteria.</p>
        </div>
      ) : view === 'kanban' ? (
        /* Odoo Kanban Board View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drivers.map((driver) => {
            const expired = isExpired(driver.licenseExpiry);
            const lowScore = driver.safetyScore < 75;

            return (
              <div key={driver.id} className={`bg-background-panel border rounded-sm p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-t-4 ${
                expired || driver.status === 'SUSPENDED' ? 'border-status-red border-t-status-red' : lowScore ? 'border-status-orange border-t-status-orange' : 'border-border border-t-primary'
              }`}>
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold tracking-tight text-primary">{driver.licenseNumber}</span>
                    <StatusBadge status={driver.status} />
                  </div>

                  <h3 className="font-bold text-sm text-text-primary mt-1.5 flex items-center justify-between">
                    <span>{driver.name}</span>
                    {expired && (
                      <span className="inline-flex items-center text-[10px] bg-status-red/10 text-status-red font-bold px-1.5 py-0.5 rounded border border-status-red/30">
                        EXPIRED
                      </span>
                    )}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Category:</span>
                      <span className="font-semibold text-text-primary">{driver.licenseCategory}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1"><Calendar className="w-3 h-3" /><span>Expiry:</span></span>
                      <span className={`font-mono font-semibold ${expired ? 'text-status-red font-bold' : 'text-text-primary'}`}>
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1"><Phone className="w-3 h-3" /><span>Contact:</span></span>
                      <span className="font-mono text-text-primary">{driver.contactNumber}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span>Safety Score:</span>
                      <span className={`font-mono font-bold ${driver.safetyScore >= 90 ? 'text-status-green' : driver.safetyScore >= 75 ? 'text-status-orange' : 'text-status-red'}`}>
                        {driver.safetyScore} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Status Toggles & Delete */}
                {canManage && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <select
                      value={driver.status}
                      onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                      className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background-page text-text-primary font-medium focus:outline-none focus:border-primary"
                    >
                      <option value="AVAILABLE" disabled={expired}>Available</option>
                      <option value="ON_TRIP">On Trip</option>
                      <option value="OFF_DUTY">Off Duty</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>

                    {hasRole('FLEET_MANAGER') && (
                      <button
                        onClick={() => handleDelete(driver.id, driver.name)}
                        className="text-text-muted hover:text-status-red p-1 rounded transition-colors"
                        title="Delete Driver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Odoo Dense Data Table View */
        <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">License No</th>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Safety Score</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.map((driver) => {
                const expired = isExpired(driver.licenseExpiry);
                return (
                  <tr key={driver.id} className={`hover:bg-black/[0.015] transition-colors ${expired ? 'bg-status-red/[0.03]' : ''}`}>
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">{driver.licenseNumber}</td>
                    <td className="py-2.5 px-4 font-medium text-text-primary flex items-center space-x-2">
                      <span>{driver.name}</span>
                      {expired && <span className="bg-status-red text-white text-[9px] font-bold px-1 rounded">EXPIRED</span>}
                    </td>
                    <td className="py-2.5 px-4">{driver.licenseCategory}</td>
                    <td className={`py-2.5 px-4 font-mono ${expired ? 'text-status-red font-bold' : ''}`}>
                      {new Date(driver.licenseExpiry).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{driver.contactNumber}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${driver.safetyScore >= 90 ? 'text-status-green' : driver.safetyScore >= 75 ? 'text-status-orange' : 'text-status-red'}`}>
                      {driver.safetyScore}%
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={driver.status} />
                    </td>
                    {canManage && (
                      <td className="py-2.5 px-4 text-right space-x-2">
                        <select
                          value={driver.status}
                          onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                          className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-background-page text-text-primary"
                        >
                          <option value="AVAILABLE" disabled={expired}>Available</option>
                          <option value="ON_TRIP">On Trip</option>
                          <option value="OFF_DUTY">Off Duty</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>

                        {hasRole('FLEET_MANAGER') && (
                          <button
                            onClick={() => handleDelete(driver.id, driver.name)}
                            className="text-text-muted hover:text-status-red transition-colors inline-block align-middle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Driver Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Driver Compliance Profile">
        {formError && (
          <div className="bg-status-red/10 border border-status-red text-status-red text-xs p-3 rounded-sm mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Driver Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">License Number</label>
              <input
                type="text"
                required
                placeholder="e.g. DL-2018-9876543"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono uppercase focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">License Category</label>
              <input
                type="text"
                required
                placeholder="e.g. CE (Heavy Trailer), C, D"
                value={formData.licenseCategory}
                onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">License Expiry Date</label>
              <input
                type="date"
                required
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Contact Phone</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Initial Safety Score (0-100)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.safetyScore}
                onChange={(e) => setFormData({ ...formData, safetyScore: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
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
              Register Driver Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
