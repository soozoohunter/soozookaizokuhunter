// express/server.js (Final Corrected Version)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { sequelize, connectToDatabase } = require('./models');
const { initializeBlockchainService } = require('./utils/chain');
const createAdmin = require('./createDefaultAdmin');

// --- 路由定義 ---
const authRouter = require('./routes/authRoutes');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const searchRoutes = require('./routes/searchRoutes');
const reportRouter = require('./routes/report');
const infringementRouter = require('./routes/infringement');
const paymentRoutes = require('./routes/paymentRoutes');
const searchMilvusRouter = require('./routes/searchMilvus');

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
// 使 'uploads' 目錄下的檔案可以透過 URL 公開訪問
// 例如: https://yourdomain.com/uploads/reports/report_123.pdf
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

// --- 健康檢查路由 ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- 伺服器啟動流程 ---
const PORT = process.env.EXPRESS_PORT || 3000;

/**
 * 統一的、異步的伺服器啟動函式
 * 確保所有關鍵服務都初始化成功後，再啟動 Express 伺服器監聽請求。
 */
async function startServer() {
    try {
        // 步驟 1: 連線到 PostgreSQL 資料庫
        logger.info('[Startup] Initializing Database connection...');
        await connectToDatabase(); // 此函式應在 models/index.js 中定義
        logger.info('[Startup] Database connection successful.');
        
        // (可選) 同步資料庫模型，並建立預設管理員帳號
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true }); // 開發時使用 alter: true
            logger.info('[Startup] Database synchronized.');
            await createAdmin();
        }

        // 步驟 2: 初始化區塊鏈服務 (包含重試機制)
        logger.info('[Startup] Initializing Blockchain service...');
        await initializeBlockchainService();
        logger.info('[Startup] Blockchain service initialization successful.');

        // 步驟 3: 所有服務就緒，啟動 Express 監聽
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        // 如果任何關鍵步驟失敗，記錄致命錯誤並終止程序
        logger.error(`[Startup] FAILED to start server: ${error.message}`);
        process.exit(1);
    }
}

// 執行啟動程序
startServer();
