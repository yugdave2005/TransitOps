const { getChannel } = require('../config/rabbitmq');
const { getIO } = require('../config/socket');

async function startTelemetryWorker() {
  try {
    const channel = getChannel();
    if (!channel) {
      console.warn('⚠️ [telemetry.worker] AMQP channel not available. Worker running in WebSocket direct mode.');
      return;
    }

    const exchange = 'transitops.events';
    const queue = 'telemetry.socket.worker';

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, 'vehicle.telemetry_updated');

    console.log('✅ [telemetry.worker] Subscribed to AMQP queue:', queue, 'listening for GPS telemetry broadcasts');

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const { telemetry, timestamp } = payload;

        const io = getIO();
        if (io && telemetry) {
          io.emit('vehicle:telemetry', {
            timestamp: timestamp || new Date().toISOString(),
            telemetry
          });
        }

        channel.ack(msg);
      } catch (workerErr) {
        console.error('❌ [telemetry.worker] Error processing AMQP telemetry:', workerErr.message);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.error('❌ [telemetry.worker] Failed to start telemetry consumer worker:', err.message);
  }
}

module.exports = {
  startTelemetryWorker
};
