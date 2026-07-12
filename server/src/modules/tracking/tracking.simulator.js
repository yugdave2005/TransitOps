const prisma = require('../../config/prisma');
const { getChannel } = require('../../config/rabbitmq');
const { getIO } = require('../../config/socket');

// Predefined transport corridors with waypoints across India
const ROUTES = {
  MUMBAI_PUNE: [
    { lat: 18.9400, lng: 72.8353, label: 'Mumbai Port' },
    { lat: 19.0330, lng: 73.0297, label: 'Navi Mumbai' },
    { lat: 18.7557, lng: 73.4091, label: 'Lonavala Ghat' },
    { lat: 18.6298, lng: 73.7997, label: 'Pimpri-Chinchwad' },
    { lat: 18.5204, lng: 73.8567, label: 'Pune MIDC Hub' }
  ],
  DELHI_JAIPUR: [
    { lat: 28.6139, lng: 77.2090, label: 'Delhi Inland Depot' },
    { lat: 28.4595, lng: 77.0266, label: 'Gurugram Hub' },
    { lat: 28.1920, lng: 76.6191, label: 'Rewari Checkpost' },
    { lat: 27.5530, lng: 76.6346, label: 'Alwar Bypass' },
    { lat: 26.9124, lng: 75.7873, label: 'Jaipur Logistics Hub' }
  ],
  BANGALORE_CHENNAI: [
    { lat: 12.9716, lng: 77.5946, label: 'Bangalore Peenya' },
    { lat: 12.7409, lng: 77.8253, label: 'Hosur Industrial Border' },
    { lat: 12.5266, lng: 78.2146, label: 'Krishnagiri Hub' },
    { lat: 12.9246, lng: 79.1353, label: 'Vellore Toll' },
    { lat: 13.0827, lng: 80.2707, label: 'Chennai Harbor Depot' }
  ]
};

// State holding simulated telemetry for every vehicle (`vehicleId -> { routeKey, waypointIdx, lat, lng, speed, fuel, heading }`)
const simulationState = new Map();
let simulatorInterval = null;
let isRunning = false;

function initOrUpdateVehicleTelemetry(vehicle) {
  if (!simulationState.has(vehicle.id)) {
    // Assign a random route
    const routeKeys = Object.keys(ROUTES);
    const chosenRouteKey = routeKeys[Math.floor(Math.random() * routeKeys.length)];
    const startPt = ROUTES[chosenRouteKey][0];

    // Add a slight jitter (approx 0 - 5km) so vehicles at the depot don't perfectly overlap on map
    const jitterLat = (Math.random() - 0.5) * 0.05;
    const jitterLng = (Math.random() - 0.5) * 0.05;

    simulationState.set(vehicle.id, {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      type: vehicle.type,
      status: vehicle.status,
      routeKey: chosenRouteKey,
      waypointIdx: 0,
      lat: startPt.lat + jitterLat,
      lng: startPt.lng + jitterLng,
      speed: vehicle.status === 'ON_TRIP' ? Math.floor(45 + Math.random() * 35) : 0,
      fuel: Math.floor(65 + Math.random() * 35),
      heading: 90,
      lastUpdated: new Date().toISOString()
    });
  } else {
    // Sync current status from DB
    const current = simulationState.get(vehicle.id);
    current.status = vehicle.status;
    current.registrationNo = vehicle.registrationNo;
    if (vehicle.status !== 'ON_TRIP') {
      current.speed = 0;
    } else if (current.speed === 0) {
      current.speed = Math.floor(45 + Math.random() * 35);
    }
  }
  return simulationState.get(vehicle.id);
}

/**
 * Step motion along waypoints for a single vehicle
 */
function stepVehicleMotion(state) {
  if (state.status !== 'ON_TRIP') {
    state.speed = 0;
    state.lastUpdated = new Date().toISOString();
    return state;
  }

  const route = ROUTES[state.routeKey] || ROUTES.MUMBAI_PUNE;
  const targetPt = route[(state.waypointIdx + 1) % route.length];

  // Calculate small delta step towards target point
  const latDiff = targetPt.lat - state.lat;
  const lngDiff = targetPt.lng - state.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // If very close to waypoint, advance index
  if (distance < 0.03) {
    state.waypointIdx = (state.waypointIdx + 1) % route.length;
  } else {
    // Step forward (~0.012 deg per 3 seconds simulated speed)
    const stepSize = 0.012 * (state.speed / 60);
    state.lat += (latDiff / distance) * stepSize;
    state.lng += (lngDiff / distance) * stepSize;

    // Estimate heading angle
    state.heading = Math.round((Math.atan2(lngDiff, latDiff) * 180) / Math.PI);
    if (state.heading < 0) state.heading += 360;
  }

  // Slight speed & fuel jitter
  state.speed = Math.max(30, Math.min(85, state.speed + Math.floor(Math.random() * 7 - 3)));
  state.fuel = Math.max(5, state.fuel - 0.1);
  state.lastUpdated = new Date().toISOString();

  return state;
}

/**
 * Main simulation loop fired every 3 seconds
 */
async function tickSimulation() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, registrationNo: true, type: true, status: true, maxLoadCapacity: true }
    });

    const telemetryUpdates = [];

    for (const v of vehicles) {
      let state = initOrUpdateVehicleTelemetry(v);
      state = stepVehicleMotion(state);
      telemetryUpdates.push({ ...state });
    }

    // Publish to RabbitMQ AND directly emit to Socket.io for immediate UI responsiveness
    const channel = getChannel();
    const io = getIO();

    if (channel) {
      const exchange = 'transitops.events';
      const routingKey = 'vehicle.telemetry_updated';
      const payload = Buffer.from(JSON.stringify({
        event: routingKey,
        timestamp: new Date().toISOString(),
        telemetry: telemetryUpdates
      }));
      channel.publish(exchange, routingKey, payload);
    }

    if (io) {
      io.emit('vehicle:telemetry', {
        timestamp: new Date().toISOString(),
        telemetry: telemetryUpdates
      });
    }
  } catch (err) {
    console.error('❌ [tracking.simulator] Tick error:', err.message);
  }
}

function startSimulator(intervalMs = 3000) {
  if (isRunning) return;
  isRunning = true;
  console.log(`📡 [tracking.simulator] Started live GPS telemetry simulation loop (${intervalMs}ms interval)`);
  
  // Run initial tick immediately
  tickSimulation();
  simulatorInterval = setInterval(tickSimulation, intervalMs);
}

function stopSimulator() {
  if (!isRunning) return;
  isRunning = false;
  if (simulatorInterval) clearInterval(simulatorInterval);
  simulatorInterval = null;
  console.log('🛑 [tracking.simulator] Stopped live GPS telemetry simulation loop.');
}

async function getSnapshot() {
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, registrationNo: true, type: true, status: true, maxLoadCapacity: true, odometer: true }
  });

  return vehicles.map(v => initOrUpdateVehicleTelemetry(v));
}

function isSimulatorRunning() {
  return isRunning;
}

module.exports = {
  startSimulator,
  stopSimulator,
  getSnapshot,
  isSimulatorRunning
};
