const amqp = require('amqplib');
const logger = require('../utils/logger');

const BROKER_URL = process.env.BROKER_URL || 'amqp://localhost';
const SCAN_QUEUE = 'scan_tasks';

class QueueService {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    // Connect to RabbitMQ and assert queue
    async connect() {
        if (this.channel) {
            return;
        }
        try {
            this.connection = await amqp.connect(BROKER_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(SCAN_QUEUE, { durable: true });
            logger.info('[QueueService] RabbitMQ connected and queue asserted successfully.');
        } catch (error) {
            logger.error('[QueueService] Failed to connect to RabbitMQ:', error.message);
            throw error;
        }
    }

    // Backwards compatibility
    init() {
        return this.connect();
    }

    async sendToQueue(task) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available.');
        }
        try {
            const message = JSON.stringify(task);
            this.channel.sendToQueue(SCAN_QUEUE, Buffer.from(message), { persistent: true });
            logger.info(`[QueueService] Task sent to queue: ${message}`);
        } catch (error) {
            logger.error('[QueueService] Failed to send task to queue:', error);
            throw error;
        }
    }

    consumeTasks(handler) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available.');
        }
        this.channel.consume(
            SCAN_QUEUE,
            async (msg) => {
                if (!msg) return;
                let ack = false;
                try {
                    const payload = JSON.parse(msg.content.toString());
                    ack = await handler(payload);
                } catch (err) {
                    logger.error('[QueueService] Error processing message:', err);
                } finally {
                    if (ack) {
                        this.channel.ack(msg);
                    } else {
                        this.channel.nack(msg, false, false);
                    }
                }
            },
            { noAck: false }
        );
        logger.info('[QueueService] Started consuming tasks from queue.');
    }
}

module.exports = new QueueService();
