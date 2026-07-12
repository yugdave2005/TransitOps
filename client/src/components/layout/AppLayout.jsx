import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from './Toast';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import { Truck, LogOut, Bell, X } from 'lucide-react';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { subscribe } = useSocket();
  const { showToast } = useToast();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global WebSocket listener for alerts
  useEffect(() => {
    const unsubAlert = subscribe('notification:alert', (payload) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        type: payload.type || 'info',
        title: payload.title || 'System Alert',
        message: payload.message,
        time: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 20));
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-background-page overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-12 bg-primary text-white flex items-center justify-between px-4 shadow-md z-30 select-none flex-shrink-0">
        <Link to="/" className="flex items-center space-x-2 font-bold text-base tracking-tight hover:opacity-95">
          <Truck className="w-5 h-5 text-yellow-300" />
          <span>TransitOps <span className="text-[10px] font-normal opacity-70">ERP v2</span></span>
        </Link>

        <div className="flex items-center space-x-3 text-xs">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-1.5 hover:bg-black/20 rounded transition-colors text-white/90 hover:text-white"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-primary rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-background-panel border border-border rounded shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background-page/80">
                  <span className="text-xs font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-muted text-xs">
                      No notifications yet. System alerts will appear here.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 text-xs flex items-start gap-3 hover:bg-black/[0.02] transition-colors ${!n.read ? 'bg-primary/[0.04]' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                          n.type === 'error' ? 'bg-status-red' :
                          n.type === 'success' ? 'bg-status-green' :
                          n.type === 'warning' ? 'bg-status-orange' :
                          'bg-primary'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary leading-tight">{n.title}</div>
                          <div className="text-text-secondary mt-0.5 leading-snug">{n.message}</div>
                          <div className="text-[10px] text-text-muted mt-1 font-mono">
                            {n.time.toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="text-text-muted hover:text-text-primary p-0.5 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 border-l border-white/20 pl-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="font-semibold leading-none text-xs">{user?.name}</div>
              <div className="text-[10px] text-yellow-200 mt-0.5">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 hover:bg-black/20 rounded transition-colors text-white/90 hover:text-white"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumbs />
          <main className="flex-1 overflow-y-auto p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
