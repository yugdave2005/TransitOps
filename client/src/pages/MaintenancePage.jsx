import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import { formatINR, getFriendlyErrorMessage } from '../lib/format';
import { maintenanceSchema, validate } from '../lib/validators';
import { Wrench, Plus, Search, Filter, Truck, IndianRupee, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const { subscribe } = useSocket();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, scheduled: 0, inProgress: 0, completed: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    title: 'Engine Oil Change & Brake Pad Replacement',
    description: 'Routine 10,000 km preventative service and diagnostic check.',
    cost: 450,
    priority: 'MEDIUM',
    status: 'IN_PROGRESS'
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchLogsAndMetrics = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [lRes, mRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/maintenance/metrics')
      ]);

      setLogs(lRes.data.logs);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to fetch maintenance logs:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      // Only available or already in shop vehicles can be scheduled
      const eligible = res.data.vehicles.filter(v => v.status !== 'RETIRED' && v.status !== 'ON_TRIP');
      setVehicles(eligible);
      if (eligible.length > 0 && !form.vehicleId) {
        setForm(prev => ({ ...prev, vehicleId: eligible[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  useEffect(() => {
    fetchLogsAndMetrics();
  }, [fetchLogsAndMetrics]);

  useEffect(() => {
    const unsub = subscribe('maintenance:updated', () => {
      fetchLogsAndMetrics();
    });
    return () => unsub();
  }, [subscribe, fetchLogsAndMetrics]);

  const handleOpenModal = () => {
    setError('');
    fetchVehicles();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const { success, errors } = validate(maintenanceSchema, {
      vehicleId: form.vehicleId,
      title: form.title,
      description: form.description,
      cost: Number(form.cost),
      priority: form.priority,
    });
    if (!success) { setFieldErrors(errors); return; }

    setSubmitting(true);
    try {
      await api.post('/maintenance', {
        vehicleId: form.vehicleId,
        title: form.title,
        description: form.description,
        cost: Number(form.cost),
        priority: form.priority,
        status: form.status
      });

      showToast({
        type: 'success',
        title: 'Repair Checked Into Shop',
        message: 'Vehicle status automatically locked to IN_SHOP.'
      });
      setIsModalOpen(false);
      fetchLogsAndMetrics();
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.response?.data?.error || err.message);
      setError(friendlyMsg);
      showToast({
        type: 'error',
        title: 'Maintenance Order Failed',
        message: friendlyMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (logId, newStatus) => {
    try {
      await api.patch(`/maintenance/${logId}/status`, { status: newStatus });
      showToast({
        type: newStatus === 'COMPLETED' ? 'success' : 'info',
        title: `Repair ${newStatus}`,
        message: newStatus === 'COMPLETED' ? 'Vehicle automatically released back to AVAILABLE.' : `Status updated to ${newStatus}.`
      });
      fetchLogsAndMetrics();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update repair status.'
      });
    }
  };

  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-status-orange" />
            <span>Shop Maintenance & Repair Control</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Automatic asset state interlocks: logging a shop repair locks vehicle to IN_SHOP; completion releases asset back to AVAILABLE.
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenModal} variant="primary" size="md" icon={Plus}>
            Log Repair Order
          </Button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Active In Shop" value={metrics.inProgress} icon={Wrench} borderLeft="border-l-status-orange" color="text-status-orange" />
        <KpiCard title="Scheduled Repairs" value={metrics.scheduled} icon={Clock} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Completed Service" value={metrics.completed} icon={CheckCircle2} borderLeft="border-l-status-green" color="text-status-green" />
        <KpiCard title="Total Shop Expenditure" value={formatINR(metrics.totalCost)} icon={IndianRupee} borderLeft="border-l-primary" color="text-primary" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search repair title or truck reg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-sm text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-sm px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="IN_PROGRESS">In Progress (Active in Shop)</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed (Asset Released)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4">Vehicle Reg</th>
              <th className="py-3 px-4">Repair Order Title</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4 text-right">Cost Estimate</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Logged Date</th>
              <th className="py-3 px-4 text-right">Interlock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-text-secondary">Loading shop maintenance records...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-text-muted italic">No shop repair records found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-primary">{log.vehicle?.registrationNo || 'N/A'}</td>
                  <td className="py-2.5 px-4 font-semibold text-text-primary">
                    <div>{log.title}</div>
                    {log.description && <div className="text-[10px] text-text-secondary font-normal truncate max-w-xs">{log.description}</div>}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.priority === 'CRITICAL' ? 'bg-status-red/15 text-status-red' :
                      log.priority === 'HIGH' ? 'bg-status-orange/15 text-status-orange' : 'bg-background-muted text-text-secondary'
                    }`}>
                      {log.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-text-primary">{formatINR(log.cost)}</td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-text-muted font-mono">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-right space-x-2">
                    {log.status === 'SCHEDULED' && (
                      <button onClick={() => handleStatusUpdate(log.id, 'IN_PROGRESS')} className="bg-status-orange text-white px-2 py-1 rounded font-medium shadow-sm">Start Work</button>
                    )}
                    {log.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleStatusUpdate(log.id, 'COMPLETED')} className="bg-status-green text-white px-2 py-1 rounded font-medium shadow-sm">Mark Complete & Release</button>
                    )}
                    {log.status === 'COMPLETED' && (
                      <span className="text-[11px] font-mono text-status-green font-semibold">✓ Asset Released</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Repair Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Check Vehicle Into Shop">

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Select Available/Depot Vehicle</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
            >
              <option value="" disabled>-- Select Truck --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNo} ({v.type} - {v.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Repair Order Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Work Description / Diagnostics</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Interlock</option>
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
            <Button type="submit" variant="primary" size="md" isLoading={submitting}>
              Check Into Shop (Lock IN_SHOP)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
