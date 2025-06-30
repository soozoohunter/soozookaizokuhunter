const amqp = require('amqplib');
const logger = require('../utils/logger');

const BROKER_URL = process.env.BROKER_URL || 'amqp://localhost';
const SCAN_QUEUE = 'scan_tasks';

class QueueService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connect();
    }

    async connect() {
        try {
            this.connection = await amqp.connect(BROKER_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(SCAN_QUEUE, { durable: true });
            logger.info('[QueueService] RabbitMQ connected and queue asserted.');
        } catch (error) {
            logger.error('[QueueService] Failed to connect to RabbitMQ:', error);
            setTimeout(() => this.connect(), 5000);
        }
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
}

module.exports = new QueueService();
