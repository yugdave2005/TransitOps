import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { ToastProvider } from './components/layout/Toast';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import TrackingPage from './pages/TrackingPage';
import { Truck, Users, MapPin, Wrench, Fuel, BarChart2, ShieldCheck, LogOut, Navigation } from 'lucide-react';

function DashboardWelcome() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm">
        <h2 className="text-xl font-bold text-text-primary">Welcome to TransitOps v2, {user?.name}!</h2>
        <p className="text-sm text-text-secondary mt-1">
          The foundation (Phase 0) & Track A1 are complete: Layered Domain Architecture, RabbitMQ Event Bus, Socket.io Real-Time Server, and Odoo Theme UI Shell (`Track B1`) are live locally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm border-l-4 border-l-primary">
          <h3 className="font-bold text-base text-primary flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Teammate A (Track A: Core Operations)</span>
          </h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Active/Done: Vehicles (`/modules/vehicles`) & Drivers (`/modules/drivers`). Next: Trips Lifecycle (`/modules/trips` + 10 Business Rules), Maintenance, and `status.worker.js`.
          </p>
        </div>

        <div className="bg-background-panel border border-border p-6 rounded-sm shadow-sm border-l-4 border-l-status-blue">
          <h3 className="font-bold text-base text-status-blue flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Teammate B (Track B: Real-Time UI & OSM Tracking)</span>
          </h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Active/Done: Odoo Component Library (`Track B1` built locally). Next: OpenStreetMap Live Fleet Map (`FleetMap.jsx`), `tracking.simulator.js`, and Recharts Analytics.
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
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/auth/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/auth/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <AppLayout><DashboardWelcome /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/vehicles" element={user ? <AppLayout><VehiclesPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/drivers" element={user ? <AppLayout><DriversPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/trips" element={user ? <AppLayout><TripsPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/tracking" element={user ? <AppLayout><TrackingPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
