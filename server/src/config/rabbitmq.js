const amqp = require('amqplib');
const config = require('./env');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'transitops.events';

const QUEUES = {
  STATUS_LOCK: 'q.status.lock',
  STATUS_UNLOCK: 'q.status.unlock',
  STATUS_SHOP: 'q.status.vehicle_to_shop',
  STATUS_AVAIL: 'q.status.vehicle_available',
  TRACKING_BROADCAST: 'q.tracking.broadcast',
  TRACKING_PERSIST: 'q.tracking.persist',
  ANALYTICS_TRIP: 'q.analytics.trip',
  NOTIFICATION_ALERT: 'q.notification.alert'
};

async function connectRabbitMQ() {
  try {
    console.log(`[RabbitMQ] Connecting to ${config.rabbitmqUrl}...`);
    connection = await amqp.connect(config.rabbitmqUrl);
    channel = await connection.createChannel();

    // Setup Exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Setup Queues and Bindings
    for (const q of Object.values(QUEUES)) {
      await channel.assertQueue(q, { durable: true });
    }

    // Bind routing keys
    await channel.bindQueue(QUEUES.STATUS_LOCK, EXCHANGE_NAME, 'trip.dispatched');
    await channel.bindQueue(QUEUES.STATUS_UNLOCK, EXCHANGE_NAME, 'trip.completed');
    await channel.bindQueue(QUEUES.STATUS_UNLOCK, EXCHANGE_NAME, 'trip.cancelled');
    await channel.bindQueue(QUEUES.STATUS_SHOP, EXCHANGE_NAME, 'maintenance.created');
    await channel.bindQueue(QUEUES.STATUS_AVAIL, EXCHANGE_NAME, 'maintenance.closed');

    await channel.bindQueue(QUEUES.TRACKING_BROADCAST, EXCHANGE_NAME, 'vehicle.telemetry_updated');
    await channel.bindQueue(QUEUES.TRACKING_PERSIST, EXCHANGE_NAME, 'vehicle.telemetry_updated');

    await channel.bindQueue(QUEUES.ANALYTICS_TRIP, EXCHANGE_NAME, 'trip.completed');
    await channel.bindQueue(QUEUES.NOTIFICATION_ALERT, EXCHANGE_NAME, 'maintenance.created');
    await channel.bindQueue(QUEUES.NOTIFICATION_ALERT, EXCHANGE_NAME, 'trip.dispatched');

    console.log('[RabbitMQ] Connected and exchange/queues initialized successfully.');
    return channel;
  } catch (err) {
    console.warn(`[RabbitMQ] Connection error: ${err.message}. Retrying in 5s...`);
    setTimeout(connectRabbitMQ, 5000);
    return null;
  }
}

function getChannel() {
  return channel;
}

function getExchangeName() {
  return EXCHANGE_NAME;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  getExchangeName,
  QUEUES
};
