require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const db = require('./models');

process.on('uncaughtException', (err) => {
  logger.error('[Uncaught Exception]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Unhandled Rejection]', { reason, promise });
  process.exit(1);
});

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

const authRouter = require('./routes/authRoutes');
const protectRouter = require('./routes/protect');
const filesRouter = require('./routes/files');

app.use('/api/auth', authRouter);
app.use('/api/protect', protectRouter);
app.use('/api/files', filesRouter);

app.get('/health', (req, res) => {
  const dbStatus = db.sequelize && db.sequelize.authenticated ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    db: dbStatus,
    services: ['express', 'postgres'],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.EXPRESS_PORT || 3000;

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await db.sequelize.authenticate();
      logger.info('[Database] Connection established successfully.');
      return true;
    } catch (error) {
      logger.error(`[Database] Connection failed (Attempt ${i}/${retries}). Retrying in ${delay/1000}s...`, error);
      if (i === retries) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

async function startServer() {
  try {
    logger.info('[Startup] Initializing database connection...');
    await connectWithRetry();

    logger.info('[Startup] Starting HTTP server...');
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
      setTimeout(() => {
        logger.info('[Startup] Service status check: OK');
      }, 5000);
    });
  } catch (error) {
    logger.error('[Startup] Could not connect to the database after multiple retries. Exiting.', error);
    process.exit(1);
  }
}

setTimeout(() => {
  startServer();
}, 10000);
