require('dotenv').config();

// Global error handlers placed at the very beginning
process.on('uncaughtException', (err, origin) => {
    console.error(`[FATAL] Uncaught Exception at: ${origin}`, err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const logger = require('./utils/logger');
const db = require('./models');

// Route imports
const protectRoutes = require('./routes/protect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');

// Services
const ipfsService = require('./services/ipfsService');

// App & server initialization
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload (multer)
const TEMP_DIR = path.join('/app/uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
const upload = multer({ dest: TEMP_DIR });

// Static files
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// Routes
// Multer middleware applied within individual route files when needed
app.use('/api/protect', protectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    const MAX_DB_RETRIES = parseInt(process.env.DB_CONN_RETRIES || '5', 10);
    const DB_RETRY_DELAY = parseInt(process.env.DB_CONN_RETRY_DELAY_MS || '3000', 10);

    try {
        logger.info('[Startup] Starting server initialization...');

        // 1. Initialize IPFS service with limited retries
        try {
            await ipfsService.init();
            logger.info('[ipfsService] IPFS initialized successfully');
        } catch (ipfsError) {
            logger.error('[ipfsService] IPFS initialization failed, proceeding without IPFS:', ipfsError);
        }

        // 2. Connect to database with retry logic
        logger.info('[Startup] Connecting to database...');
        let dbConnected = false;
        for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
            try {
                await db.sequelize.authenticate();
                dbConnected = true;
                logger.info('[Database] Connection established.');
                break;
            } catch (err) {
                logger.warn(`[Database] Connection attempt ${attempt}/${MAX_DB_RETRIES} failed: ${err.message}`);
                if (attempt < MAX_DB_RETRIES) {
                    await new Promise(res => setTimeout(res, DB_RETRY_DELAY));
                }
            }
        }

        if (!dbConnected) {
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

startServer().catch((error) => {
    logger.error('[FATAL] Error in startServer execution:', error);
    process.exit(1);
});
