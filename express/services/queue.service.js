// express/services/queue.service.js (最終簡化版)
const amqp = require('amqplib');
const logger = require('../utils/logger');

const BROKER_URL = process.env.BROKER_URL || 'amqp://localhost';
const SCAN_QUEUE = 'scan_tasks';

let channel = null;

const connect = async () => {
    if (channel) return;
    try {
        const connection = await amqp.connect(BROKER_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(SCAN_QUEUE, { durable: true });
        logger.info('[QueueService] RabbitMQ connected and queue asserted successfully.');
    } catch (error) {
        logger.error('[QueueService] Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const sendToQueue = async (task) => {
    if (!channel) {
        await connect();
    }
    const message = JSON.stringify(task);
    channel.sendToQueue(SCAN_QUEUE, Buffer.from(message), { persistent: true });
    logger.info(`[QueueService] Task sent to queue: ${message}`);
};

const consumeTasks = async (handler) => {
    if (!channel) {
        await connect();
    }
    logger.info('[QueueService] Worker is setting up consumer...');
    channel.consume(SCAN_QUEUE, async (msg) => {
        if (msg !== null) {
            try {
                const payload = JSON.parse(msg.content.toString());
                const success = await handler(payload);
                if (success) {
                    channel.ack(msg);
                } else {
                    logger.warn(`[QueueService] Handler failed for task, rejecting message.`);
                    channel.nack(msg, false, false);
                }
            } catch (err) {
                logger.error('[QueueService] Error processing message, rejecting:', err);
                channel.nack(msg, false, false);
            }
        }
    }, { noAck: false });
    logger.info('[QueueService] Worker is now consuming tasks from queue.');
};

module.exports = {
    connect,
    sendToQueue,
    consumeTasks,
};
