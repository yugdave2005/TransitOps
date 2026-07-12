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
          <Route path="/vehicles" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'].includes(user.role) ? <AppLayout><VehiclesPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/drivers" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER'].includes(user.role) ? <AppLayout><DriversPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/trips" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'].includes(user.role) ? <AppLayout><TripsPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/tracking" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'].includes(user.role) ? <AppLayout><TrackingPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/maintenance" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER'].includes(user.role) ? <AppLayout><MaintenancePage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/fuel" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER', 'FINANCIAL_ANALYST'].includes(user.role) ? <AppLayout><FuelPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/expenses" element={user && ['FLEET_MANAGER', 'FINANCIAL_ANALYST'].includes(user.role) ? <AppLayout><ExpensesPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="/reports" element={user && ['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'].includes(user.role) ? <AppLayout><ReportsPage /></AppLayout> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
