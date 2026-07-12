import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from './Toast';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import { Truck, LogOut, Bell, Grid, UserCheck } from 'lucide-react';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { connected, subscribe } = useSocket();
  const { showToast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global WebSocket listener for alerts or status updates
  useEffect(() => {
    const unsubAlert = subscribe('notification:alert', (payload) => {
      showToast({
        type: payload.type || 'info',
        title: payload.title || 'System Alert',
        message: payload.message
      });
    });

    return () => {
      unsubAlert();
    };
  }, [subscribe, showToast]);

  return (
    <div className="min-h-screen flex flex-col bg-background-page overflow-hidden">
      {/* Odoo Signature Top Horizontal Bar (#714B67) */}
      <header className="h-12 bg-primary text-white flex items-center justify-between px-4 shadow-md z-30 select-none">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-black/15 text-white/90 hover:text-white transition-colors flex items-center justify-center"
            title="Toggle Menu Grid"
          >
            <Grid className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center space-x-2 font-bold text-base tracking-tight hover:opacity-95">
            <Truck className="w-5 h-5 text-yellow-300" />
            <span>TransitOps <span className="text-xs font-normal opacity-75">v2 ERP</span></span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          {/* Socket Connection Status Pulse */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-black/20 px-2.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-status-green animate-pulse' : 'bg-status-red'}`}></span>
            <span className="font-mono text-[11px]">{connected ? 'AMQP / WS Live' : 'Offline'}</span>
          </div>

          <button
            onClick={() => showToast({ type: 'info', title: 'Notifications', message: 'All systems operational. No unread alerts.' })}
            className="relative p-1.5 hover:bg-black/20 rounded-sm transition-colors text-white/90 hover:text-white"
            title="Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 border-l border-white/20 pl-4">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="font-semibold leading-none">{user?.name}</div>
              <div className="text-[10px] text-yellow-200 mt-0.5">{user?.role}</div>
            </div>
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

      {/* Main Body Shell (Sidebar + Breadcrumbs + Page Content) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        <div className="flex-1 flex flex-col overflow-hidden bg-background-page">
          <Breadcrumbs />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
