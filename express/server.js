require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { initSocket } = require('./socket');
const db = require('./models');

process.on('uncaughtException', err => { logger.error('[Uncaught Exception]', err); process.exit(1); });
process.on('unhandledRejection', (reason, promise) => { logger.error('[Unhandled Rejection]', { reason, promise }); process.exit(1); });

const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/admin');
const protectRouter = require('./routes/protect');
const filesRouter = require('./routes/files');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const scansRouter = require('./routes/scans');

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], credentials: true, }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/protect', protectRouter);
app.use('/api/files', filesRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scans', scansRouter);

app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

const PORT = process.env.EXPRESS_PORT || 3000;

const connectWithRetry = async (retries = 10, delay = 5000) => {
    for (let i = 1; i <= retries; i++) {
        try {
            await db.sequelize.authenticate();
            logger.info('[Database] Connection has been established successfully.');
            return;
        } catch (error) {
            logger.error(`[Database] Connection failed. Attempt ${i}/${retries}. Retrying in ${delay / 1000}s...`);
            if (i === retries) throw error;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

async function startServer() {
    try {
        await connectWithRetry();
        server.listen(PORT, () => {
            logger.info(`Server is ready on port ${PORT}`);
        });
    } catch (error) {
        logger.error('[Startup] Failed to start Express server due to DB connection failure.', error);
        process.exit(1);
    }
}

startServer();
