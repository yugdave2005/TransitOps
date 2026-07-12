const { getChannel } = require('../config/rabbitmq');
const { getIO } = require('../config/socket');
const prisma = require('../config/prisma');

async function startStatusWorker() {
  try {
    const channel = getChannel();
    if (!channel) {
      console.warn('⚠️ [status.worker] AMQP channel not available. Worker running in WebSocket-only fallback mode.');
      return;
    }

    const exchange = 'transitops.events';
    const queue = 'trips.status.worker';

    // Assert durable queue & bind to trip.* routing keys
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, 'trip.*');

    console.log('✅ [status.worker] Subscribed to AMQP queue:', queue, 'listening for trip.* events');

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const { event, tripId, vehicleId, driverId, status } = payload;

        console.log(`📨 [status.worker] Consumed event [${event}] for Trip [${tripId}] -> Status: ${status}`);

        const io = getIO();

        // If trip was dispatched, ensure asset status synchronization in cache/realtime
        if (event === 'trip.dispatched' || status === 'DISPATCHED') {
          if (io) {
            io.emit('vehicle:statusChange', { vehicleId, status: 'ON_TRIP' });
            io.emit('driver:statusChange', { driverId, status: 'ON_TRIP' });
            io.emit('trip:workerSync', { tripId, status: 'DISPATCHED', timestamp: new Date().toISOString() });
          }
        }

        // If trip completed or cancelled, ensure asset status synchronization
        if (event === 'trip.completed' || event === 'trip.cancelled' || status === 'COMPLETED' || status === 'CANCELLED') {
          if (io) {
            io.emit('vehicle:statusChange', { vehicleId, status: 'AVAILABLE' });
            io.emit('driver:statusChange', { driverId, status: 'AVAILABLE' });
            io.emit('trip:workerSync', { tripId, status, timestamp: new Date().toISOString() });
          }
        }

        channel.ack(msg);
      } catch (workerErr) {
        console.error('❌ [status.worker] Error processing AMQP message:', workerErr.message);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.error('❌ [status.worker] Failed to start AMQP status worker:', err.message);
  }
}

module.exports = {
  startStatusWorker
};
