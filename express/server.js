// express/server.js (Final Corrected Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
// 【關鍵修正】從 models 中同時解構出 sequelize 和 connectToDatabase
const { sequelize, connectToDatabase } = require('./models');
const { initializeBlockchainService } = require('./utils/chain');
const createAdmin = require('./createDefaultAdmin');
const queueService = require('./services/queue.service');

process.on('unhandledRejection', (reason) => {
    logger.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    logger.error('[UncaughtException]', err);
});

// --- 路由定義 ---
const authRouter = require('./routes/authRoutes');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const searchRoutes = require('./routes/searchRoutes');
const reportRouter = require('./routes/report');
const infringementRouter = require('./routes/infringement');
const paymentRoutes = require('./routes/paymentRoutes');
const searchMilvusRouter = require('./routes/searchMilvus');
const scanRoutes = require('./routes/scans'); // newly added route for scan status

const app = express();

// --- 基礎中介層 ---
app.use(cors({
    origin: '*', // 在生產環境中應限制為您的前端 URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 設定靜態檔案目錄 ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
logger.info(`[Setup] Static directory served at '/uploads' -> '${path.join(__dirname, '../uploads')}'`);

// --- API 路由 ---
app.use('/api/auth', authRouter);
app.use('/api/protect', protectRouter);
app.use('/api/admin', adminRouter);
app.use('/api/search', searchRoutes);
app.use('/api/report', reportRouter);
app.use('/api/infringement', infringementRouter);
app.use('/api/payment', paymentRoutes);
app.use('/api/milvus', searchMilvusRouter);
app.use('/api/scans', scanRoutes); // route handling scan status queries

// --- 健康檢查路由 ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- 伺服器啟動流程 ---
const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    try {
        // 步驟 1: 連線到 PostgreSQL 資料庫
        logger.info('[Startup] Step 1: Initializing Database connection...');
        await connectToDatabase();
        logger.info('[Startup] Step 1: Database connection successful.');
        
        // 【關鍵修正】步驟 2: 同步資料庫模型 (建立或更新資料表)
        logger.info('[Startup] Step 2: Synchronizing database models...');
        // { alter: true } 會安全地更新資料表以匹配模型，如果表不存在則會建立。
        await sequelize.sync({ alter: true });
        logger.info('[Startup] Step 2: Database models synchronized successfully.');

        // 步驟 3: 初始化 RabbitMQ
        logger.info('[Startup] Step 3: Initializing RabbitMQ connection...');
        await queueService.init();
        logger.info('[Startup] Step 3: RabbitMQ connection successful.');

        // 步驟 4: 建立預設管理員帳號
        logger.info('[Startup] Step 4: Setting up default admin user...');
        await createAdmin();
        logger.info('[Startup] Step 4: Default admin user setup complete.');

        // 步驟 5: 初始化區塊鏈服務
        logger.info('[Startup] Step 5: Initializing Blockchain service...');
        await initializeBlockchainService();
        logger.info('[Startup] Step 5: Blockchain service initialization successful.');

        // 最終步驟: 所有服務就緒，啟動 Express 監聽
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        logger.error(`[Startup] FAILED to start server:`, { message: error.message, stack: error.stack });
        process.exit(1);
    }
}

// 執行啟動程序
startServer();
