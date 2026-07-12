const { getChannel } = require('../config/rabbitmq');

async function subscribeQueue(queueName, handler) {
  const channel = getChannel();
  if (!channel) {
    console.warn(`[RabbitMQ Subscriber] Channel not open, delaying subscription to '${queueName}'`);
    setTimeout(() => subscribeQueue(queueName, handler), 3000);
    return;
  }

  console.log(`[RabbitMQ Subscriber] Listening to queue '${queueName}'...`);
  channel.consume(queueName, async (msg) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload, msg);
        channel.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ Subscriber] Error handling message from '${queueName}':`, err);
        // Nack and do not requeue to avoid infinite loop if malformed, or requeue if transient
        channel.nack(msg, false, false);
      }
    }
  });
}

module.exports = {
  subscribeQueue
};
