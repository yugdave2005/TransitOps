import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import { Truck, Users, MapPin, Wrench, Fuel, BarChart2, ShieldCheck, LogOut } from 'lucide-react';

// Basic Login Page (Odoo Styled)
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('fleet_mgr@transitops.com');
  const [password, setPassword] = React.useState('Password123!');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-page px-4">
      <div className="max-w-md w-full bg-background-panel border border-border rounded-sm shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-primary text-white mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">TransitOps ERP</h1>
          <p className="text-sm text-text-secondary mt-1">Smart Transport Operations Platform v2</p>
        </div>

        {error && (
          <div className="bg-status-red/10 border border-status-red text-status-red text-sm p-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
              placeholder="fleet_mgr@transitops.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-sm focus:outline-none focus:border-primary text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-sm transition-colors text-sm shadow-sm"
          >
            Log In to Operations
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs text-text-muted">
          <p>Hackathon Demo Accounts (Password: Password123!)</p>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-text-secondary font-mono">
            <span>fleet_mgr@transitops.com</span>
            <span>driver@transitops.com</span>
            <span>safety@transitops.com</span>
            <span>analyst@transitops.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected App Shell & Dashboard Placeholder
function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="min-h-screen flex flex-col bg-background-page">
      {/* Odoo Signature Top Bar (#714B67) */}
      <header className="h-12 bg-primary text-white flex items-center justify-between px-4 shadow-sm z-30">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 font-bold text-base tracking-tight hover:opacity-90">
            <Truck className="w-5 h-5 text-yellow-300" />
            <span>TransitOps <span className="text-xs font-normal opacity-80">v2</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <Link to="/" className="px-3 py-1.5 rounded-sm bg-black/15 text-white">Dashboard</Link>
            <Link to="/tracking" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Live Fleet Map</Link>
            <Link to="/vehicles" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Vehicles</Link>
            <Link to="/drivers" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Drivers</Link>
            <Link to="/trips" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Trips</Link>
            <Link to="/maintenance" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Maintenance</Link>
            <Link to="/reports" className="px-3 py-1.5 rounded-sm hover:bg-black/10 transition-colors">Reports</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          {/* Socket status indicator */}
          <div className="flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-status-green animate-pulse' : 'bg-status-red'}`}></span>
            <span className="font-mono">{connected ? 'Live WS' : 'Offline'}</span>
          </div>

          <div className="flex items-center space-x-2 border-l border-white/20 pl-4">
            <span className="font-semibold">{user?.name}</span>
            <span className="odoo-badge bg-white/20 text-white text-[10px]">{user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 hover:bg-black/20 rounded-sm transition-colors text-white/90 hover:text-white"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function DashboardWelcome() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm">
        <h2 className="text-xl font-bold text-text-primary">Welcome to TransitOps v2, {user?.name}!</h2>
        <p className="text-sm text-text-secondary mt-1">
          The foundation (Phase 0) is complete: Layered Domain Architecture, RabbitMQ Event Bus, Socket.io Real-Time Server, and Odoo Theme shell are initialized.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm border-l-4 border-l-primary">
          <h3 className="font-bold text-base text-primary flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Teammate A (Track A: Core Operations)</span>
          </h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Ready for your modules: Vehicles (`/modules/vehicles`), Drivers (`/modules/drivers`), Trips Lifecycle (`/modules/trips` + 10 Business Rules), Maintenance, and `status.worker.js`.
          </p>
        </div>

        <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm border-l-4 border-l-status-blue">
          <h3 className="font-bold text-base text-status-blue flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Teammate B (Track B: Real-Time UI & OSM Tracking)</span>
          </h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Ready for your modules: Odoo Component Library, OpenStreetMap Live Fleet Map (`FleetMap.jsx`, `VehicleDetailDrawer.jsx`), `tracking.simulator.js`, and Dashboard Recharts Analytics (`/modules/reports`).
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-page">
        <div className="text-center">
          <Truck className="w-8 h-8 text-primary animate-bounce mx-auto mb-3" />
          <p className="text-sm text-text-secondary font-medium">Loading TransitOps session...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <AppLayout><DashboardWelcome /></AppLayout> : <Navigate to="/auth/login" />} />
        <Route path="/vehicles" element={user ? <AppLayout><VehiclesPage /></AppLayout> : <Navigate to="/auth/login" />} />
        <Route path="/drivers" element={user ? <AppLayout><DriversPage /></AppLayout> : <Navigate to="/auth/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
