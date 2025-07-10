// express/server.js (v3.1 - 最終路由修正版)
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { initSocket } = require('./socket');
const db = require('./models');

// Global error handlers
process.on('uncaughtException', err => {
    logger.error('[Uncaught Exception]', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Unhandled Rejection]', { reason, promise });
});

// --- Routers ---
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/admin');
const protectRouter = require('./routes/protect');
const filesRouter = require('./routes/files');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const scansRouter = require('./routes/scans'); // [核心修正] 引入 scans 路由

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/protect', protectRouter);
app.use('/api/files', filesRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scans', scansRouter); // [核心修正] 啟用 scans 路由

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    try {
        logger.info('[Startup] Step 1: Initializing Database connection...');
        await db.sequelize.authenticate();
        logger.info('[Startup] Step 1: Database connection successful.');

        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server with Socket.IO is ready and running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        logger.error('[Startup] Failed to start Express server:', error);
        process.exit(1);
    }
}

startServer();
