// express/services/queue.service.js (健壯性升級版)
const amqp = require('amqplib');
const logger = require('../utils/logger');

const BROKER_URL = process.env.BROKER_URL || 'amqp://localhost';
const SCAN_QUEUE = 'scan_tasks';
const RECONNECT_DELAY = 5000; // 5 秒後重試

class QueueService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnecting = false;
    }

    async connect() {
        // 防止在重連過程中發生重複連線
        if (this.isConnecting) {
            logger.warn('[QueueService] Connection attempt already in progress.');
            return;
        }
        this.isConnecting = true;

        try {
            this.connection = await amqp.connect(BROKER_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(SCAN_QUEUE, { durable: true });
            
            this.isConnecting = false;
            logger.info('[QueueService] RabbitMQ connected and queue asserted successfully.');

            // [升級] 增加連線關閉和錯誤的事件監聽器
            this.connection.on('close', () => {
                logger.error('[QueueService] RabbitMQ connection closed! Attempting to reconnect...');
                this.resetConnection();
                setTimeout(() => this.connect(), RECONNECT_DELAY);
            });
            this.connection.on('error', (err) => {
                logger.error('[QueueService] RabbitMQ connection error:', err.message);
            });

        } catch (error) {
            logger.error(`[QueueService] Failed to connect to RabbitMQ: ${error.message}. Retrying in ${RECONNECT_DELAY / 1000}s...`);
            this.isConnecting = false;
            this.resetConnection();
            setTimeout(() => this.connect(), RECONNECT_DELAY);
        }
    }

    resetConnection() {
        this.channel = null;
        this.connection = null;
    }

    async sendToQueue(task) {
        if (!this.channel) {
            logger.error('[QueueService] Cannot send task, channel is not available.');
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

    async consumeTasks(handler) {
        // 確保在設定消費者前已連線
        if (!this.channel) {
            logger.warn('[QueueService] Channel not ready, delaying consumer setup...');
            await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
            return this.consumeTasks(handler); // 再次嘗試
        }

        logger.info('[QueueService] Starting to consume tasks from queue...');
        this.channel.consume(
            SCAN_QUEUE,
            async (msg) => {
                if (!msg) return;
                
                try {
                    const payload = JSON.parse(msg.content.toString());
                    const success = await handler(payload);
                    if (success) {
                        this.channel.ack(msg); // 處理成功，確認訊息
                    } else {
                        // 處理失敗，但是一個可預期的失敗，不將訊息放回佇列
                        logger.warn(`[QueueService] Handler failed for task, message will be rejected. Payload: ${msg.content.toString()}`);
                        this.channel.nack(msg, false, false); 
                    }
                } catch (err) {
                    logger.error('[QueueService] Unhandled error processing message, rejecting message:', err);
                    this.channel.nack(msg, false, false); // 同樣不放回，避免毒訊息循環
                }
            },
            { noAck: false } // 使用手動確認機制
        );
    }
}

// 匯出單一實例
module.exports = new QueueService();
