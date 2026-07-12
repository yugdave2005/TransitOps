const { getChannel } = require('../../config/rabbitmq');
const { getIO } = require('../../config/socket');

async function publishTripEvent(eventAction, trip) {
  try {
    // 1. Publish AMQP message for background workers (status.worker.js)
    const channel = getChannel();
    if (channel) {
      const exchange = 'transitops.events';
      const routingKey = `trip.${eventAction.toLowerCase()}`;
      const payload = Buffer.from(JSON.stringify({
        event: routingKey,
        timestamp: new Date().toISOString(),
        tripId: trip.id,
        tripCode: trip.tripCode,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        status: trip.status,
        cargoWeight: trip.cargoWeight
      }));

      channel.publish(exchange, routingKey, payload, { persistent: true });
    }

    // 2. Broadcast real-time Socket.io update to client dashboards
    const io = getIO();
    if (io) {
      io.emit('trip:updated', {
        action: eventAction,
        trip
      });

      // Also emit global toast alert for critical state changes
      const titleMap = {
        DISPATCHED: `Trip Dispatched: ${trip.tripCode}`,
        IN_PROGRESS: `Trip En Route: ${trip.tripCode}`,
        COMPLETED: `Trip Delivered: ${trip.tripCode}`,
        CANCELLED: `Trip Cancelled: ${trip.tripCode}`
      };

      const typeMap = {
        DISPATCHED: 'info',
        IN_PROGRESS: 'info',
        COMPLETED: 'success',
        CANCELLED: 'warning'
      };

      io.emit('notification:alert', {
        type: typeMap[trip.status] || 'info',
        title: titleMap[trip.status] || `Trip Status: ${trip.status}`,
        message: `${trip.vehicle?.registrationNo || 'Vehicle'} assigned to ${trip.driver?.name || 'Driver'} from ${trip.origin} to ${trip.destination} (${trip.cargoWeight} kg cargo).`
      });
    }
  } catch (err) {
    console.error(`Failed to publish trip event (${eventAction}):`, err.message);
  }
}

module.exports = {
  publishTripEvent
};
