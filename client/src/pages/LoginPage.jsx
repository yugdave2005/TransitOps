import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Wrench, BarChart } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('fleet_mgr@transitops.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background-page">
      {/* Left Column — Odoo Brand & Architecture Highlights */}
      <div className="md:w-5/12 bg-primary text-white p-8 md:p-12 flex flex-col justify-between shadow-lg z-10">
        <div>
          <div className="flex items-center space-x-3 font-bold text-xl tracking-tight">
            <Truck className="w-8 h-8 text-yellow-300" />
            <span>TransitOps <span className="text-sm font-normal opacity-80">v2 ERP</span></span>
          </div>
          <p className="text-xs text-yellow-100/80 mt-1 uppercase tracking-wider font-semibold">
            Smart Transport Operations Platform
          </p>
        </div>

        <div className="my-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
            Enterprise Fleet Control & Real-Time Telemetry
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Powered by a Domain-Driven layered architecture with asynchronous RabbitMQ AMQP messaging and Socket.io high-frequency tracking.
          </p>

          <div className="space-y-3 pt-4 border-t border-white/20 text-xs">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Role-Based Access Control (`FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`)</span>
            </div>
            <div className="flex items-center space-x-3">
              <Wrench className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Automated Maintenance Logs & Status Lock Enforcements</span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Live OpenStreetMap Routes & Recharts KPI Dashboards</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-white/60 font-mono">
          Phase 0 & Track A1 Active — Odoo Theme (#714B67)
        </div>
      </div>

      {/* Right Column — Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-background-panel border border-border rounded-sm shadow-xl p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Sign In to Your Workspace</h3>
            <p className="text-xs text-text-secondary mt-1">Enter your credentials to access the transport operations portal.</p>
          </div>

          {error && (
            <div className="bg-status-red/10 border border-status-red text-status-red text-xs p-3.5 rounded-sm flex items-start space-x-2">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. fleet_mgr@transitops.com"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary text-text-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-medium py-2.5 rounded-sm shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Operations'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Click Demo Credentials */}
          <div className="pt-5 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2 text-center">
              Instant Hackathon Demo Accounts (Click to Fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickDemo('fleet_mgr@transitops.com')}
                type="button"
                className="p-2 border border-border rounded-sm text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-bold text-primary text-[11px]">Fleet Manager</div>
                <div className="text-[10px] font-mono text-text-muted truncate">fleet_mgr@...</div>
              </button>
              <button
                onClick={() => handleQuickDemo('driver@transitops.com')}
                type="button"
                className="p-2 border border-border rounded-sm text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-bold text-status-blue text-[11px]">Driver</div>
                <div className="text-[10px] font-mono text-text-muted truncate">driver@...</div>
              </button>
              <button
                onClick={() => handleQuickDemo('safety@transitops.com')}
                type="button"
                className="p-2 border border-border rounded-sm text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-bold text-status-green text-[11px]">Safety Officer</div>
                <div className="text-[10px] font-mono text-text-muted truncate">safety@...</div>
              </button>
              <button
                onClick={() => handleQuickDemo('analyst@transitops.com')}
                type="button"
                className="p-2 border border-border rounded-sm text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-bold text-status-orange text-[11px]">Financial Analyst</div>
                <div className="text-[10px] font-mono text-text-muted truncate">analyst@...</div>
              </button>
            </div>
          </div>

          <div className="pt-4 text-center text-xs text-text-secondary">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary font-semibold hover:underline">
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
