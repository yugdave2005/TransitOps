import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom animated Odoo divIcon markers
const createVehicleIcon = (vehicle, isSelected) => {
  const isMoving = vehicle.status === 'ON_TRIP' && vehicle.speed > 0;
  
  const colorMap = {
    AVAILABLE: '#28a745', // green
    ON_TRIP: '#007bff',   // blue
    IN_SHOP: '#fd7e14',   // orange
    RETIRED: '#dc3545'    // red
  };
  const color = colorMap[vehicle.status] || '#714B67';

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${isSelected ? '36px' : '28px'};
      height: ${isSelected ? '36px' : '28px'};
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
      transition: all 0.3s ease;
    ">
      ${isMoving ? `
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid ${color};
          opacity: 0.6;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      ` : ''}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
        <path d="M15 18H9"></path>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
        <circle cx="17" cy="18" r="2"></circle>
        <circle cx="7" cy="18" r="2"></circle>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
    iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14]
  });
};

export default function FleetMap({ vehicles = [], selectedVehicle, onSelectVehicle }) {
  const defaultCenter = [18.9400, 73.0297]; // Centered near Mumbai/Navi Mumbai corridor

  return (
    <div className="w-full h-full relative bg-background-muted overflow-hidden rounded-sm border border-border shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* OpenStreetMap Tile Layer (Offline compatible fallback if needed, uses standard OSM tiles) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vehicles.map((v) => {
          if (!v.lat || !v.lng) return null;
          const isSelected = selectedVehicle && (selectedVehicle.vehicleId === v.vehicleId || selectedVehicle.id === v.id);

          return (
            <Marker
              key={v.vehicleId || v.id}
              position={[v.lat, v.lng]}
              icon={createVehicleIcon(v, isSelected)}
              eventHandlers={{
                click: () => onSelectVehicle(v)
              }}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
                <div className="text-xs font-sans">
                  <div className="font-bold text-primary">{v.registrationNo}</div>
                  <div className="text-[10px] text-gray-600 uppercase">{v.status} | {v.speed || 0} km/h</div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[900] bg-background-panel/95 backdrop-blur border border-border p-3 rounded-sm shadow-md text-[11px] space-y-1.5 select-none">
        <div className="font-bold text-text-primary uppercase tracking-wider text-[10px] border-b border-border pb-1 mb-1">
          Telemetry Marker Legend
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-blue inline-block"></span>
          <span className="text-text-secondary">On Trip (Active GPS Pulse)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-green inline-block"></span>
          <span className="text-text-secondary">Available (Hub / Depot)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-orange inline-block"></span>
          <span className="text-text-secondary">In Shop (Maintenance Log)</span>
        </div>
      </div>
    </div>
  );
}
