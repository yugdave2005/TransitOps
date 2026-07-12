const { getChannel } = require('../../config/rabbitmq');
const { getIO } = require('../../config/socket');

async function publishMaintenanceEvent(eventAction, log) {
  try {
    const channel = getChannel();
    if (channel) {
      const exchange = 'transitops.events';
      const routingKey = `maintenance.${eventAction.toLowerCase()}`;
      const payload = Buffer.from(JSON.stringify({
        event: routingKey,
        timestamp: new Date().toISOString(),
        logId: log.id,
        vehicleId: log.vehicleId,
        status: log.status,
        cost: log.cost,
        title: log.title
      }));
      channel.publish(exchange, routingKey, payload, { persistent: true });
    }

    const io = getIO();
    if (io) {
      io.emit('maintenance:updated', {
        action: eventAction,
        log
      });

      // Also sync vehicle state instantly if shop status changed
      if (log.status === 'SCHEDULED' || log.status === 'IN_PROGRESS') {
        io.emit('vehicle:statusChange', { vehicleId: log.vehicleId, status: 'IN_SHOP' });
      } else if (log.status === 'COMPLETED' || log.status === 'CANCELLED') {
        io.emit('vehicle:statusChange', { vehicleId: log.vehicleId, status: 'AVAILABLE' });
      }

      io.emit('notification:alert', {
        type: log.status === 'COMPLETED' ? 'success' : 'warning',
        title: `Shop Maintenance (${log.status})`,
        message: `Vehicle ${log.vehicle?.registrationNo || 'Fleet Asset'}: ${log.title} ($${log.cost})`
      });
    }
  } catch (err) {
    console.error(`Failed to publish maintenance event (${eventAction}):`, err.message);
  }
}

module.exports = {
  publishMaintenanceEvent
};
