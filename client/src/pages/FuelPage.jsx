import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import { Fuel, Plus, Search, Truck, DollarSign, Gauge, Users } from 'lucide-react';

export default function FuelPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ totalLogs: 0, totalLiters: 0, totalCost: 0, avgCostPerLiter: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    liters: 150,
    costPerLiter: 1.45,
    odometerReading: 45200,
    stationName: 'Expressway Highway Pump #4'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLogsAndMetrics = useCallback(async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      const [lRes, mRes] = await Promise.all([
        api.get('/fuel', { params }),
        api.get('/fuel/metrics')
      ]);

      setLogs(lRes.data.logs);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to fetch fuel logs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchAssets = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setVehicles(vRes.data.vehicles);
      setDrivers(dRes.data.drivers);
      if (vRes.data.vehicles.length > 0 && !form.vehicleId) {
        setForm(prev => ({ ...prev, vehicleId: vRes.data.vehicles[0].id, odometerReading: vRes.data.vehicles[0].odometer + 120 }));
      }
      if (dRes.data.drivers.length > 0 && !form.driverId) {
        setForm(prev => ({ ...prev, driverId: dRes.data.drivers[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch assets for fuel form:', err);
    }
  };

  useEffect(() => {
    fetchLogsAndMetrics();
  }, [fetchLogsAndMetrics]);

  const handleOpenModal = () => {
    setError('');
    fetchAssets();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/fuel', {
        vehicleId: form.vehicleId,
        driverId: form.driverId || undefined,
        liters: Number(form.liters),
        costPerLiter: Number(form.costPerLiter),
        odometerReading: Number(form.odometerReading),
        stationName: form.stationName
      });

      showToast({
        type: 'success',
        title: 'Fuel Log Recorded',
        message: 'Vehicle odometer reading synchronized automatically.'
      });
      setIsModalOpen(false);
      fetchLogsAndMetrics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record fuel fill-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicleObj = vehicles.find(v => v.id === form.vehicleId);
  const canManage = hasRole('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER');

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <Fuel className="w-5 h-5 text-status-orange" />
            <span>Fleet Fuel & Efficiency Logs</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time fuel expenditure tracking with automatic odometer progression validation (`Rule 9`).
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenModal} variant="primary" size="md" icon={Plus}>
            Log Fuel Fill-Up
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Fill-Up Logs" value={metrics.totalLogs} icon={Fuel} borderLeft="border-l-status-orange" color="text-status-orange" />
        <KpiCard title="Total Fuel Consumed" value={`${metrics.totalLiters.toLocaleString()} L`} icon={Gauge} borderLeft="border-l-status-blue" color="text-status-blue" />
        <KpiCard title="Total Fuel Expenditure" value={`$${metrics.totalCost.toLocaleString()}`} icon={DollarSign} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Average Cost / Liter" value={`$${metrics.avgCostPerLiter}`} icon={DollarSign} borderLeft="border-l-status-green" color="text-status-green" />
      </div>

      {/* Search Bar */}
      <div className="bg-background-panel border border-border p-3.5 rounded-sm shadow-sm flex items-center justify-between">
        <div className="relative min-w-[260px] max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search gas station or truck reg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-sm text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs font-mono text-text-secondary">Showing {logs.length} fill-up receipts</span>
      </div>

      {/* Table */}
      <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4">Vehicle Reg</th>
              <th className="py-3 px-4">Gas Station / Vendor</th>
              <th className="py-3 px-4">Driver</th>
              <th className="py-3 px-4 text-right">Liters Filled</th>
              <th className="py-3 px-4 text-right">Cost / Liter</th>
              <th className="py-3 px-4 text-right">Total Receipt</th>
              <th className="py-3 px-4 text-right">Odometer Sync</th>
              <th className="py-3 px-4">Log Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="8" className="py-8 text-center text-text-secondary">Loading fuel ledger...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="8" className="py-8 text-center text-text-muted italic">No fuel fill-up logs recorded yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-primary">{log.vehicle?.registrationNo}</td>
                  <td className="py-2.5 px-4 font-semibold text-text-primary">{log.stationName}</td>
                  <td className="py-2.5 px-4">{log.driver?.name || 'Self-Service'}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-status-blue">{log.liters} L</td>
                  <td className="py-2.5 px-4 text-right font-mono">${log.costPerLiter}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">${log.totalCost}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-text-secondary">{log.odometerReading} km</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-text-muted">{new Date(log.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Fuel Fill-Up Receipt">
        {error && <div className="bg-status-red/10 border border-status-red text-status-red text-xs p-3 rounded-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Select Truck</label>
              <select
                required
                value={form.vehicleId}
                onChange={(e) => {
                  const v = vehicles.find(item => item.id === e.target.value);
                  setForm({ ...form, vehicleId: e.target.value, odometerReading: v ? v.odometer + 100 : form.odometerReading });
                }}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registrationNo} (Curr Odo: {v.odometer} km)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Assigned Driver</label>
              <select
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="">-- Self / Unassigned --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Gas Station / Pump Name</label>
            <input
              type="text"
              required
              value={form.stationName}
              onChange={(e) => setForm({ ...form, stationName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Liters Filled</label>
              <input
                type="number"
                step="0.1"
                required
                min="1"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Cost Per Liter ($)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.1"
                value={form.costPerLiter}
                onChange={(e) => setForm({ ...form, costPerLiter: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Current Odometer (km)</label>
              <input
                type="number"
                required
                value={form.odometerReading}
                onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
              {selectedVehicleObj && Number(form.odometerReading) < selectedVehicleObj.odometer && (
                <p className="mt-0.5 text-[10px] text-status-red font-bold">⚠️ Cannot be less than {selectedVehicleObj.odometer} km</p>
              )}
            </div>
          </div>

          <div className="bg-background-page p-3 border border-border rounded-sm flex items-center justify-between font-mono font-bold">
            <span className="text-text-secondary">Estimated Receipt Total:</span>
            <span className="text-primary text-base">${Number((form.liters * form.costPerLiter).toFixed(2))}</span>
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-sm text-text-secondary font-medium">Cancel</button>
            <Button type="submit" variant="primary" size="md" isLoading={submitting}>Save Receipt & Sync Odo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
