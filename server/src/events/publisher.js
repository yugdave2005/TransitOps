const { getChannel, getExchangeName } = require('../config/rabbitmq');

async function publishEvent(routingKey, payload) {
  try {
    const channel = getChannel();
    if (!channel) {
      console.warn(`[RabbitMQ Publisher] Channel not open, skipping publish for event '${routingKey}'`);
      return false;
    }

    const exchange = getExchangeName();
    const buffer = Buffer.from(JSON.stringify(payload));
    
    channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      timestamp: Date.now(),
      contentType: 'application/json'
    });

    console.log(`[RabbitMQ Publisher] Published event '${routingKey}'`);
    return true;
  } catch (err) {
    console.error(`[RabbitMQ Publisher] Error publishing '${routingKey}':`, err.message);
    return false;
  }
}

module.exports = {
  publishEvent
};
