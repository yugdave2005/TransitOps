import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, Users, MapPin, Wrench, BarChart2, Compass, ChevronLeft, ChevronRight, ShieldCheck, Fuel, DollarSign } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard Overview', icon: Compass, exact: true },
  { path: '/tracking', label: 'Live Fleet Map', icon: MapPin },
  { path: '/vehicles', label: 'Vehicles Directory', icon: Truck },
  { path: '/drivers', label: 'Driver Profiles', icon: Users },
  { path: '/trips', label: 'Trip Dispatching', icon: ShieldCheck },
  { path: '/maintenance', label: 'Shop Maintenance', icon: Wrench },
  { path: '/fuel', label: 'Fuel Fill-Up Logs', icon: Fuel },
  { path: '/expenses', label: 'Financial Ledger', icon: DollarSign },
  { path: '/reports', label: 'Analytics & Reports', icon: BarChart2 }
];

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <aside
      className={`bg-background-panel border-r border-border transition-all duration-200 flex flex-col z-20 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header / Module Title */}
      <div className="h-12 border-b border-border px-3 flex items-center justify-between bg-background-page/50">
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary truncate pl-1">
            ERP Modules
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-sm hover:bg-black/5 text-text-secondary mx-auto transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold border-l-4 border-l-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/5 border-l-4 border-l-transparent'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border bg-background-page/50 text-[11px] text-text-muted font-mono">
          <div className="flex items-center justify-between">
            <span>System Status:</span>
            <span className="text-status-green font-bold">ONLINE</span>
          </div>
          <div className="mt-0.5 truncate">DB: PostgreSQL 16</div>
        </div>
      )}
    </aside>
  );
}
