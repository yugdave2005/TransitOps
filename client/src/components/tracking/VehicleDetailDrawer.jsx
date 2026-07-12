import React from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { Truck, Users, Fuel, Gauge, Compass, X, ShieldCheck, Wrench, AlertCircle, Navigation } from 'lucide-react';

export default function VehicleDetailDrawer({ vehicle, onClose, onQuickAction }) {
  if (!vehicle) return null;

  const isMoving = vehicle.status === 'ON_TRIP' && vehicle.speed > 0;
  const fuelColor = vehicle.fuel < 20 ? 'bg-status-red' : vehicle.fuel < 45 ? 'bg-status-orange' : 'bg-status-green';

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 bg-background-panel border border-border shadow-2xl rounded-sm overflow-hidden flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <Truck className="w-5 h-5 text-yellow-300 flex-shrink-0" />
          <div className="truncate">
            <h3 className="text-sm font-bold leading-none">{vehicle.registrationNo}</h3>
            <span className="text-[10px] text-yellow-100 uppercase tracking-wider">{vehicle.type}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/20 rounded text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-220px)]">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="font-semibold text-text-secondary">Current State:</span>
          <StatusBadge status={vehicle.status} />
        </div>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 bg-background-page p-3 rounded-sm border border-border">
          <div className="flex items-center space-x-2">
            <Gauge className={`w-5 h-5 ${isMoving ? 'text-status-blue animate-pulse' : 'text-text-muted'}`} />
            <div>
              <div className="text-[10px] text-text-secondary uppercase font-semibold">Speed</div>
              <div className="font-mono font-bold text-sm text-text-primary">{vehicle.speed || 0} <span className="text-[10px] font-normal">km/h</span></div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-primary" />
            <div>
              <div className="text-[10px] text-text-secondary uppercase font-semibold">Heading</div>
              <div className="font-mono font-bold text-sm text-text-primary">{vehicle.heading || 0}°</div>
            </div>
          </div>
        </div>

        {/* Fuel Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center space-x-1.5 font-semibold text-text-secondary">
              <Fuel className="w-3.5 h-3.5 text-status-orange" />
              <span>Fuel Tank Level</span>
            </span>
            <span className="font-mono font-bold text-text-primary">{Math.round(vehicle.fuel || 0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-background-muted rounded-full overflow-hidden border border-border/60">
            <div
              className={`h-full transition-all duration-500 ${fuelColor}`}
              style={{ width: `${Math.min(100, Math.max(0, vehicle.fuel || 0))}%` }}
            ></div>
          </div>
        </div>

        {/* Route / GPS info */}
        <div className="space-y-2 border-t border-border pt-3 text-text-secondary">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1"><Navigation className="w-3.5 h-3.5" /><span>Coordinates:</span></span>
            <span className="font-mono text-[11px] text-text-primary">{vehicle.lat?.toFixed(4)}, {vehicle.lng?.toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Route Corridor:</span>
            <span className="font-semibold text-primary truncate max-w-[150px]">
              {vehicle.routeKey ? vehicle.routeKey.replace('_', ' ➔ ') : 'In Depot'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last Telemetry Sync:</span>
            <span className="font-mono text-[10px] text-text-muted">
              {vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        {onQuickAction && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Quick Fleet Interventions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onQuickAction(vehicle.vehicleId || vehicle.id, 'IN_SHOP')}
                className="p-2 border border-border rounded text-[11px] font-medium hover:bg-status-orange/10 hover:border-status-orange text-text-primary transition-colors flex items-center justify-center space-x-1"
              >
                <Wrench className="w-3.5 h-3.5 text-status-orange" />
                <span>Flag Shop</span>
              </button>
              <button
                onClick={() => onQuickAction(vehicle.vehicleId || vehicle.id, 'AVAILABLE')}
                className="p-2 border border-border rounded text-[11px] font-medium hover:bg-status-green/10 hover:border-status-green text-text-primary transition-colors flex items-center justify-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-status-green" />
                <span>Recall Available</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
