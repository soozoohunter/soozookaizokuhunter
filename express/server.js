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
const logger = require('./utils/logger');
const db = require('./models');

// Route imports
const protectRoutes = require('./routes/protect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const scansRoutes = require('./routes/scans'); // ★ 導入新的 scans 路由

// Services
const ipfsService = require('./services/ipfsService');
const chain = require('./utils/chain'); // ★ 導入 chain 模組

// App & server initialization
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// Routes
app.use('/api/protect', protectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/scans', scansRoutes); // ★ 掛載新的 scans 路由

// ★ 新增區塊鏈專用健康檢查端點 ★
app.get('/blockchain-health', async (req, res) => {
    try {
        const health = await chain.getHealthStatus();
        if (health.status === 'healthy') {
            res.status(200).json(health);
        } else {
            res.status(503).json(health);
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Health check
app.get('/health', async (req, res) => {
    try {
        await db.sequelize.authenticate();

        const ipfs = ipfsService.getClient();
        if (!ipfs) {
            throw new Error('IPFS client not initialized');
        }
        await ipfs.version();

        const blockchainHealth = await chain.getHealthStatus();
        if (blockchainHealth.status !== 'healthy') {
            throw new Error(`Blockchain status: ${blockchainHealth.message}`);
        }

        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'connected',
            ipfs: 'connected',
            blockchain: 'connected'
        });
    } catch (error) {
        logger.error(`[Health Check] Failed: ${error.message}`);
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    const MAX_DB_RETRIES = parseInt(process.env.DB_CONN_RETRIES || '5', 10);
    const DB_RETRY_DELAY = parseInt(process.env.DB_CONN_RETRY_DELAY_MS || '3000', 10);

    try {
        logger.info('[Startup] Starting server initialization...');

        // 1. Initialize IPFS service
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

        // ★ 3. Initialize blockchain service BEFORE starting server ★
        logger.info('[Startup] Initializing blockchain service...');
        await chain.initializeBlockchainService();
        logger.info('[Startup] Blockchain service initialization complete.');

        // 4. Start HTTP server
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
