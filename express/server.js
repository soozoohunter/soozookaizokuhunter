require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const chain = require('./utils/chain');
const { initSocket } = require('./socket');
const db = require('./models');

// 全局错误处理
process.on('uncaughtException', (err) => {
  logger.error('[Uncaught Exception]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[Unhandled Rejection]', reason);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
initSocket(server);

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/protect', require('./routes/protect'));
app.use('/api/files', require('./routes/files'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/scans', require('./routes/scans'));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.EXPRESS_PORT || 3000;

// 核心修复：数据库连接重试逻辑
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await db.sequelize.authenticate();
      logger.info('[Database] Connection established successfully.');
      return;
    } catch (error) {
      logger.error(`[Database] Connection failed (Attempt ${i}/${retries}). Retrying in ${delay/1000}s...`);
      if (i === retries) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

async function startServer() {
  try {
    logger.info('[Startup] Initializing database connection...');
    await connectWithRetry();

    // 核心修复：僅同步模型，不強制重建
    await db.sequelize.sync({ alter: true });
    logger.info('[Database] Models synchronized successfully.');

    // 初始化區塊鏈服務
    try {
      logger.info('[Startup] Initializing blockchain service...');
      await chain.initializeBlockchainService();
      logger.info('[Startup] Blockchain service ready.');
    } catch (chainErr) {
      logger.error('[Startup] Failed to initialize blockchain service:', chainErr);
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    logger.error('[Startup] Fatal error during initialization:', error);
    process.exit(1);
  }
}

startServer();
