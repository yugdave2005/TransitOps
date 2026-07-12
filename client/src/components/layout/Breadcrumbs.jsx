import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAMES = {
  '': 'Overview',
  'vehicles': 'Fleet Vehicles',
  'drivers': 'Driver Profiles',
  'tracking': 'Live Fleet Map',
  'trips': 'Dispatch & Trips',
  'maintenance': 'Shop & Maintenance',
  'reports': 'Analytics & Reports'
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-text-secondary py-2 px-4 bg-background-panel border-b border-border font-medium">
      <Link to="/" className="hover:text-primary flex items-center space-x-1 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>Operations</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = ROUTE_NAMES[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
            {isLast ? (
              <span className="text-primary font-bold">{name}</span>
            ) : (
              <Link to={to} className="hover:text-primary transition-colors">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
