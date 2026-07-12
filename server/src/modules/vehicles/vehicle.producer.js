const { publishEvent } = require('../../events/publisher');
const { emitToAll } = require('../../config/socket');

function emitVehicleChanged(event, vehicle) {
  // 1. Emit Socket.io real-time update immediately
  emitToAll('vehicle:updated', { event, vehicle });
  if (event === 'status_changed') {
    emitToAll('vehicle:statusChange', { vehicleId: vehicle.id, status: vehicle.status });
  }

  // 2. Publish to RabbitMQ topic exchange
  publishEvent(`vehicle.${event}`, {
    vehicleId: vehicle.id,
    registrationNo: vehicle.registrationNo,
    status: vehicle.status,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  emitVehicleChanged
};
