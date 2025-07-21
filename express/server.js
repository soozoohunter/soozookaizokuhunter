// express/server.js
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const logger = require('./utils/logger');
const db = require('./models');

// --- Route Imports ---
const protectRoutes = require('./routes/protect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- File Upload (Multer) Setup ---
const TEMP_DIR = path.join('/app/uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
const upload = multer({ dest: TEMP_DIR });

// --- Static File Serving ---
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// --- Route Definitions ---
// The multer middleware is applied directly in the route file where it's needed (protect.js)
// This avoids applying it globally.
app.use('/api/protect', protectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Health Check ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Server Startup Logic ---
const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    const MAX_RETRIES = parseInt(process.env.DB_CONN_RETRIES || '5', 10);
    const RETRY_DELAY = parseInt(process.env.DB_CONN_RETRY_DELAY_MS || '3000', 10);

    try {
        logger.info('[Startup] Connecting to database...');

        let connected = false;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await db.sequelize.authenticate();
                connected = true;
                logger.info('[Database] Connection established.');
                break;
            } catch (err) {
                logger.warn(`[Database] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
                if (attempt < MAX_RETRIES) {
                    await new Promise(res => setTimeout(res, RETRY_DELAY));
                }
            }
        }

        if (!connected) {
            throw new Error('Database connection failed after all retries');
        }

        await db.sequelize.sync({ alter: true });
        logger.info('[Database] Models synchronized.');

        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        logger.error('[Startup] Fatal error during initialization:', error);
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

startServer().catch((error) => {
    logger.error('Asynchronous error in startServer:', error);
    process.exit(1);
});
