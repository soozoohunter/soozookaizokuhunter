require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./models');

const app = express();
const server = require('http').createServer(app);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db: db.sequelize.authenticated ? 'connected' : 'disconnected'
  });
});

// 启动服务器
const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
  try {
    // 等待数据库连接
    await db.sequelize.authenticate();
    logger.info('[Database] Connection established');

    // 同步核心表
    await Promise.all([
      db.User.sync(),
      db.File.sync()
    ]);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Express] Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    logger.error('[Startup] Fatal error during initialization:', error);
    process.exit(1);
  }
}

// 延迟启动以等待数据库
setTimeout(() => {
  startServer();
}, 10000);

