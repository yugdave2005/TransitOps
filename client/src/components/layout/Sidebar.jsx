import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Users, MapPin, Wrench, BarChart2, Compass, ShieldCheck, Fuel, DollarSign } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Compass, exact: true, roles: null },
  { path: '/tracking', label: 'Live Fleet Map', icon: MapPin, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'] },
  { path: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'] },
  { path: '/drivers', label: 'Drivers', icon: Users, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { path: '/trips', label: 'Trips', icon: ShieldCheck, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER'] },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { path: '/fuel', label: 'Fuel Logs', icon: Fuel, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DRIVER', 'FINANCIAL_ANALYST'] },
  { path: '/expenses', label: 'Expenses', icon: DollarSign, roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { path: '/reports', label: 'Reports', icon: BarChart2, roles: ['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] }
];

export default function Sidebar() {
  const { user } = useAuth();

  const allowedNavItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <aside className="w-56 bg-background-panel border-r border-border flex flex-col flex-shrink-0 h-full">
      {/* Sidebar Header */}
      <div className="h-11 border-b border-border px-4 flex items-center bg-background-page/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          Navigation
        </span>
      </div>

      {/* Navigation Links — scrollable */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-l-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.04] border-l-[3px] border-l-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-background-page/50 text-[10px] text-text-muted font-mono">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <span className="text-status-green font-bold">ONLINE</span>
        </div>
        <div className="mt-0.5 truncate">PostgreSQL 16 · Node.js</div>
      </div>
    </aside>
  );
}
