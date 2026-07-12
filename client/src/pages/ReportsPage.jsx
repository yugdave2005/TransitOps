import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import KpiCard from '../components/common/KpiCard';
import Button from '../components/common/Button';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { BarChart2, Download, FileSpreadsheet, DollarSign, ShieldCheck, Activity, Filter, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [costsData, setCostsData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('COSTS'); // COSTS | SAFETY
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/reports/costs'),
        api.get('/reports/safety')
      ]);
      setCostsData(cRes.data.data);
      setSafetyData(sRes.data.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      if (activeTab === 'COSTS') {
        const rows = [
          ['Category', 'Amount ($)'],
          ...costsData.breakdown.map(b => [b.category, b.amount]),
          ['TOTAL', costsData.totalCost]
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transitops_costs_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const rows = [
          ['Rank', 'Driver Name', 'License No', 'Safety Score', 'Status'],
          ...safetyData.leaders.map((d, i) => [i + 1, `"${d.name}"`, d.licenseNo, d.safetyScore, d.status])
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transitops_safety_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast({
        type: 'success',
        title: 'Report Exported',
        message: `${activeTab} CSV report downloaded successfully.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate CSV file.'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    const payload = activeTab === 'COSTS' ? costsData : safetyData;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `transitops_${activeTab.toLowerCase()}_summary.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ type: 'info', title: 'JSON Dump Downloaded', message: 'Full raw dataset saved.' });
  };

  if (loading || !costsData || !safetyData) {
    return (
      <div className="flex items-center justify-center h-96 text-text-secondary space-y-2 flex-col">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Compiling historical ledger and Recharts analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background-panel border border-border p-4 rounded-sm shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <span>Executive Analytics & ERP Reporting</span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Deep historical trends across operational expenditure ledgers, fuel efficiency curves, and driver safety audits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            size="sm"
            icon={FileSpreadsheet}
            isLoading={exporting}
          >
            Export CSV Table
          </Button>
          <Button
            onClick={handleExportJSON}
            variant="primary"
            size="sm"
            icon={Download}
          >
            Dump JSON
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 bg-background-panel px-4 rounded-t-sm">
        <button
          onClick={() => setActiveTab('COSTS')}
          className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'COSTS'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Operational Expenditure & Fuel Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'SAFETY'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Driver Safety Scores & Audit Rankings</span>
        </button>
      </div>

      {/* Tab Content: COSTS */}
      {activeTab === 'COSTS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Cost KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Operating Cost" value={`$${costsData.totalCost.toLocaleString()}`} icon={DollarSign} borderLeft="border-l-primary" color="text-primary" />
            <KpiCard title="Top Expense Category" value={costsData.breakdown.reduce((max, c) => c.amount > max.amount ? c : max, costsData.breakdown[0] || { category: 'N/A', amount: 0 }).category} icon={BarChart2} borderLeft="border-l-status-orange" color="text-status-orange" />
            <KpiCard title="Tracked Categories" value={costsData.breakdown.length} icon={Activity} borderLeft="border-l-status-blue" color="text-status-blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 30-Day Expense & Fuel Trend Line Chart */}
            <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm">
              <h3 className="font-bold text-sm text-text-primary mb-4 flex items-center space-x-2 border-b border-border pb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>30-Day Cumulative Cost Trajectory ($)</span>
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={costsData.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="fuel" name="Fuel Fill-Ups ($)" stroke="#007bff" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="expenses" name="Other Ledgers ($)" stroke="#714B67" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="total" name="Combined Daily ($)" stroke="#28a745" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="bg-background-panel border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
              <div className="p-3.5 bg-background-muted/80 border-b border-border font-bold text-xs uppercase text-text-secondary">
                Cost Center Ledger Summary
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border text-text-secondary">
                    <tr>
                      <th className="py-2.5 px-4">Cost Center Category</th>
                      <th className="py-2.5 px-4 text-right">Total Expenditure ($)</th>
                      <th className="py-2.5 px-4 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {costsData.breakdown.map((item, idx) => {
                      const pct = costsData.totalCost > 0 ? ((item.amount / costsData.totalCost) * 100).toFixed(1) : 0;
                      return (
                        <tr key={idx} className="hover:bg-black/[0.015]">
                          <td className="py-2.5 px-4 font-sans font-bold flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color || '#714B67' }}></span>
                            <span>{item.category}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-text-primary">${item.amount.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right text-text-secondary">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: SAFETY */}
      {activeTab === 'SAFETY' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Safety KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Audited Drivers" value={safetyData.leaders.length} icon={ShieldCheck} borderLeft="border-l-primary" color="text-primary" />
            <KpiCard title="Average Fleet Safety Score" value={`${safetyData.avgScore}/100`} icon={Activity} borderLeft="border-l-status-green" color="text-status-green" />
            <KpiCard title="Safety Compliance Standard" value="ISO 39001 Audited" icon={ShieldCheck} borderLeft="border-l-status-blue" color="text-status-blue" />
          </div>

          {/* Safety Leaderboard Chart & Table */}
          <div className="bg-background-panel border border-border p-4 rounded-sm shadow-sm">
            <h3 className="font-bold text-sm text-text-primary mb-4 flex items-center justify-between border-b border-border pb-2">
              <span className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-status-green" />
                <span>Driver Safety Score Ranking (0 - 100 Index)</span>
              </span>
              <span className="text-[11px] font-mono text-text-secondary">Sorted by highest safety index</span>
            </h3>

            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safetyData.leaders.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <RechartsTooltip formatter={(val) => [`${val}/100`, 'Safety Score']} />
                  <Bar dataKey="safetyScore" fill="#28a745" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto border border-border rounded-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-muted/80 text-text-secondary uppercase border-b border-border font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Driver Name</th>
                    <th className="py-2.5 px-4">Commercial License No</th>
                    <th className="py-2.5 px-4">Current Status</th>
                    <th className="py-2.5 px-4 text-right">Safety Index Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {safetyData.leaders.map((driver, index) => {
                    const color = driver.safetyScore >= 90 ? 'text-status-green' : driver.safetyScore >= 75 ? 'text-status-blue' : 'text-status-orange';
                    return (
                      <tr key={driver.id} className="hover:bg-black/[0.015]">
                        <td className="py-2.5 px-4 font-mono font-bold text-primary">#{index + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-text-primary">{driver.name}</td>
                        <td className="py-2.5 px-4 font-mono text-text-secondary">{driver.licenseNo}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            driver.status === 'ON_TRIP' ? 'bg-status-blue/15 text-status-blue' : 'bg-status-green/15 text-status-green'
                          }`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className={`py-2.5 px-4 text-right font-mono font-bold text-sm ${color}`}>
                          {driver.safetyScore} / 100
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
