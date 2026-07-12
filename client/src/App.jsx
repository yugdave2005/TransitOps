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
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import ExpensesPage from './pages/ExpensesPage';
import DashboardOverview from './pages/DashboardOverview';
import ReportsPage from './pages/ReportsPage';
import { Truck, Users, MapPin, Wrench, Fuel, BarChart2, ShieldCheck, LogOut, Navigation, DollarSign } from 'lucide-react';

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
          
          <Route path="/" element={user ? <AppLayout><DashboardOverview /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/vehicles" element={user ? <AppLayout><VehiclesPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/drivers" element={user ? <AppLayout><DriversPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/trips" element={user ? <AppLayout><TripsPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/tracking" element={user ? <AppLayout><TrackingPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/maintenance" element={user ? <AppLayout><MaintenancePage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/fuel" element={user ? <AppLayout><FuelPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/expenses" element={user ? <AppLayout><ExpensesPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="/reports" element={user ? <AppLayout><ReportsPage /></AppLayout> : <Navigate to="/auth/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
