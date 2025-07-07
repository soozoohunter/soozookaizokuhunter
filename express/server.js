require('dotenv').config();
const express = require('express');
const http = require('http');
const { initSocket } = require('./socket');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { connectToDatabase } = require('./models');
const { initializeBlockchainService } = require('./utils/chain');
const createAdmin = require('./createDefaultAdmin');
const queueService = require('./services/queue.service');

process.on('unhandledRejection', (reason) => {
    logger.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    logger.error('[UncaughtException]', err);
});

const authRouter = require('./routes/authRoutes');
const protectRouter = require('./routes/protect');
const adminRouter = require('./routes/admin');
const searchRoutes = require('./routes/searchRoutes');
const reportRouter = require('./routes/report');
const infringementRouter = require('./routes/infringement');
const dmcaRouter = require('./routes/dmca');
const dashboardRouter = require('./routes/dashboard');
const membershipRouter = require('./routes/membership');
const paymentRoutes = require('./routes/paymentRoutes');
const scanRoutes = require('./routes/scans');
const singleScanRouter = require('./routes/scan');
const filesRouter = require('./routes/files');
const usersRouter = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
logger.info(`[Setup] Static directory served at '/uploads' -> '${path.join(__dirname, '../uploads')}'`);

app.use('/api/auth', authRouter);
app.use('/api/protect', protectRouter);
app.use('/api/admin', adminRouter);
app.use('/api/search', searchRoutes);
app.use('/api/report', reportRouter);
app.use('/api/infringement', infringementRouter);
app.use('/api/report/dmca', dmcaRouter);
app.use('/membership', membershipRouter);
app.use('/api/payment', paymentRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/scan', singleScanRouter);
app.use('/api/files', filesRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    try {
        logger.info('[Startup] Step 1: Initializing Database connection...');
        await connectToDatabase();
        logger.info('[Startup] Step 1: Database connection successful.');

        logger.info('[Startup] Step 2: Database schema managed by migrations.');

        logger.info('[Startup] Step 3: Initializing RabbitMQ connection...');
        await queueService.connect();
        logger.info('[Startup] Step 3: RabbitMQ connection successful.');

        logger.info('[Startup] Step 4: Setting up default admin user...');
        await createAdmin();
        logger.info('[Startup] Step 4: Default admin user setup complete.');

        logger.info('[Startup] Step 5: Initializing Blockchain service...');
        await initializeBlockchainService();
        logger.info('[Startup] Step 5: Blockchain service initialization successful.');

        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server with Socket.IO is ready and running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        logger.error('[Startup] Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
