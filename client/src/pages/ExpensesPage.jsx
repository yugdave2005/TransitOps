import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import { formatINR } from '../lib/format';
import { expenseSchema, validate } from '../lib/validators';
import { IndianRupee, Plus, Search, Filter, Truck, ShieldCheck, PieChart, FileText } from 'lucide-react';

export default function ExpensesPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [metrics, setMetrics] = useState({ totalExpenses: 0, totalAmount: 0, categoryTotals: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    category: 'TOLL',
    amount: 350,
    description: 'National Highway Toll Plaza (Vellore-Krishnagiri)',
    vehicleId: '',
    tripId: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpensesAndMetrics = useCallback(async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const [eRes, mRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/expenses/metrics')
      ]);

      setExpenses(eRes.data.expenses);
      setMetrics(mRes.data.metrics);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  const fetchAssets = async () => {
    try {
      const [vRes, tRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/trips')
      ]);
      setVehicles(vRes.data.vehicles);
      setTrips(tRes.data.trips);
      if (vRes.data.vehicles.length > 0 && !form.vehicleId) {
        setForm(prev => ({ ...prev, vehicleId: vRes.data.vehicles[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch assets for expenses:', err);
    }
  };

  useEffect(() => {
    fetchExpensesAndMetrics();
  }, [fetchExpensesAndMetrics]);

  const handleOpenModal = () => {
    setError('');
    fetchAssets();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const { success, errors } = validate(expenseSchema, {
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
    });
    if (!success) { setFieldErrors(errors); return; }

    setSubmitting(true);
    try {
      await api.post('/expenses', {
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        vehicleId: form.vehicleId || undefined,
        tripId: form.tripId || undefined
      });

      showToast({
        type: 'success',
        title: 'Expense Entry Recorded',
        message: 'Financial ledger and category analytics updated.'
      });
      setIsModalOpen(false);
      fetchExpensesAndMetrics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record expense entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = hasRole('FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST');

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-status-green" />
            <span>Financial Ledger & Expense Accounting</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Categorized cost tracking (Tolls, Maintenance, Fuel, Driver Salary, Fleet Insurance) across vehicles and trips.
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenModal} variant="primary" size="md" icon={Plus}>
            Log Expense Voucher
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Ledger Entries" value={metrics.totalExpenses} icon={FileText} borderLeft="border-l-primary" color="text-primary" />
        <KpiCard title="Total Expenditure" value={formatINR(metrics.totalAmount)} icon={IndianRupee} borderLeft="border-l-status-green" color="text-status-green" />
        <KpiCard title="Toll Costs" value={formatINR(metrics.categoryTotals.TOLL || 0)} icon={PieChart} borderLeft="border-l-status-orange" color="text-status-orange" />
        <KpiCard title="Insurance & Salary" value={formatINR((metrics.categoryTotals.INSURANCE || 0) + (metrics.categoryTotals.SALARY || 0))} icon={ShieldCheck} borderLeft="border-l-status-blue" color="text-status-blue" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background-panel border border-border p-3.5 rounded-sm shadow-sm">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description or truck reg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-sm text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-border rounded-sm px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-primary"
            >
              <option value="">All Expense Categories</option>
              <option value="TOLL">Toll Charges</option>
              <option value="MAINTENANCE">Shop Maintenance</option>
              <option value="FUEL">Fuel Fill-Ups</option>
              <option value="SALARY">Driver Salary / Stipend</option>
              <option value="INSURANCE">Fleet Insurance</option>
              <option value="OTHER">Other Operational Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-background-muted/80 text-text-secondary uppercase tracking-wider font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Expense Description</th>
              <th className="py-3 px-4">Assigned Vehicle</th>
              <th className="py-3 px-4">Linked Trip Code</th>
              <th className="py-3 px-4 text-right">Voucher Amount</th>
              <th className="py-3 px-4">Posting Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="6" className="py-8 text-center text-text-secondary">Loading accounting ledger...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="6" className="py-8 text-center text-text-muted italic">No financial vouchers logged yet.</td></tr>
            ) : (
              expenses.map((item) => (
                <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="py-2.5 px-4 font-bold">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">{item.category}</span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-text-primary">{item.description}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-text-primary">{item.vehicle?.registrationNo || 'General Overhead'}</td>
                  <td className="py-2.5 px-4 font-mono text-status-blue">{item.trip?.tripCode || '—'}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-status-green text-sm">{formatINR(item.amount)}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-text-muted">{new Date(item.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Expense Voucher">

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Cost Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="TOLL">Toll Charges</option>
                <option value="MAINTENANCE">Shop Maintenance</option>
                <option value="FUEL">Fuel Fill-Up</option>
                <option value="SALARY">Driver Salary / Stipend</option>
                <option value="INSURANCE">Fleet Insurance & Licensing</option>
                <option value="OTHER">Other Operational Expense</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Voucher Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-text-secondary mb-1">Expense Description / Invoice Detail</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Linked Vehicle (Optional)</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="">-- General Overhead --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registrationNo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-text-secondary mb-1">Linked Trip (Optional)</label>
              <select
                value={form.tripId}
                onChange={(e) => setForm({ ...form, tripId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-sm bg-white focus:border-primary focus:outline-none"
              >
                <option value="">-- General Expense --</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.tripCode} ({t.origin} ➔ {t.destination})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-sm text-text-secondary font-medium">Cancel</button>
            <Button type="submit" variant="primary" size="md" isLoading={submitting}>Post Voucher to Ledger</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
