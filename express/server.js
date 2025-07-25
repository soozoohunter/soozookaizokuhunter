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
const filesRoutes = require('./routes/files'); // ★★★ 新增：會員檔案路由
const trademarkRoutes = require('./routes/trademarkCheck'); // ★★★ 新增：商標檢測路由
const paymentsRoutes = require('./routes/payments'); // ★ 新增
const casesRoutes = require('./routes/cases');
const resolutionRoutes = require('./routes/resolution');
const contactRoutes = require('./routes/contact');

// Services
const ipfsService = require('./services/ipfsService');
const chain = require('./utils/chain'); // ★ 導入 chain 模組
const { startScheduledScans } = require('./jobs/cron');

// 嘗試載入 node-cron，若失敗則停用排程功能
let cron;
try {
    cron = require('node-cron');
} catch (err) {
    logger.warn('[Startup] node-cron module not found. Cron functionality will be disabled.', err);
    cron = null;
}
const conversionTracking = require('./middleware/conversionTracking');

// App & server initialization
const app = express();
const server = http.createServer(app);

// Middleware
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://suzookaizokuhunter.com',
        'http://suzoo_frontend'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(conversionTracking);

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
app.use('/api/files', filesRoutes); // ★★★ 掛載：會員檔案路由
app.use('/api/trademark', trademarkRoutes); // ★★★ 掛載：商標檢測路由
app.use('/api/payments', paymentsRoutes); // ★ 掛載
app.use('/api/cases', casesRoutes);
app.use('/api/resolution', resolutionRoutes);
app.use('/api/contact', contactRoutes);

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
    const healthReport = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {}
    };

    try {
        // 1. Check database connection
        try {
            await db.sequelize.authenticate();
            healthReport.services.database = 'connected';
        } catch (dbError) {
            healthReport.services.database = `error: ${dbError.message}`;
            logger.error('[Health] Database connection failed:', dbError);
        }

        // 2. Check IPFS service
        try {
            const ipfs = ipfsService.getClient();
            if (!ipfs) {
                healthReport.services.ipfs = 'not_initialized';
            } else {
                const version = await ipfs.version();
                healthReport.services.ipfs = `connected (v${version.version})`;
            }
        } catch (ipfsError) {
            healthReport.services.ipfs = `error: ${ipfsError.message}`;
            logger.error('[Health] IPFS check failed:', ipfsError);
        }

        // 3. Check blockchain service
        try {
            const blockchainHealth = await chain.getHealthStatus();
            healthReport.services.blockchain = blockchainHealth;
        } catch (chainError) {
            healthReport.services.blockchain = `error: ${chainError.message}`;
            logger.error('[Health] Blockchain check failed:', chainError);
        }

        // 4. Check cron task status
        try {
            if (cron && typeof cron.getTasks === 'function') {
                const cronTasks = cron.getTasks();
                const tasksArray = Array.from(cronTasks.values());
                healthReport.services.cron = {
                    status: tasksArray.length > 0 ? 'active' : 'inactive',
                    tasks: tasksArray.map(task => task.options.rule)
                };
            } else if (!cron) {
                healthReport.services.cron = 'disabled';
            } else {
                healthReport.services.cron = 'unknown';
            }
        } catch (cronError) {
            healthReport.services.cron = `error: ${cronError.message}`;
            logger.error('[Health] Cron check failed:', cronError);
        }

        // If critical services failed, return 503
        const criticalServices = [healthReport.services.database, healthReport.services.blockchain];
        const isUnhealthy = criticalServices.some(status => String(status).includes('error'));

        if (isUnhealthy) {
            res.status(503).json(healthReport);
        } else {
            res.status(200).json(healthReport);
        }
    } catch (error) {
        healthReport.status = 'ERROR';
        healthReport.error = error.message;
        logger.error('[Health] Overall health check failed:', error);
        res.status(500).json(healthReport);
    }
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    const MAX_DB_RETRIES = parseInt(process.env.DB_CONN_RETRIES || '10', 10);
    const DB_RETRY_DELAY = parseInt(process.env.DB_CONN_RETRY_DELAY_MS || '5000', 10);
    const STARTUP_RETRY_DELAY = parseInt(process.env.STARTUP_RETRY_DELAY_MS || '30000', 10);

    try {
        logger.info('[Startup] Starting server initialization...');

        // Enhanced database connection with retries
        const connectToDatabase = async () => {
            logger.info('[Startup] Connecting to database...');
            for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
                try {
                    await db.sequelize.authenticate();
                    logger.info('[Database] Connection established.');
                    return true;
                } catch (err) {
                    logger.warn(`[Database] Connection attempt ${attempt}/${MAX_DB_RETRIES} failed: ${err.message}`);
                    if (attempt < MAX_DB_RETRIES) {
                        logger.info(`[Database] Retrying in ${DB_RETRY_DELAY/1000} seconds...`);
                        await new Promise(res => setTimeout(res, DB_RETRY_DELAY));
                    } else {
                        throw new Error('Database connection failed after all retries');
                    }
                }
            }
        };

        // 1. Connect to database
        await connectToDatabase();

        // 2. Synchronize models
        logger.info('[Startup] Synchronizing database models...');
        try {
            await db.sequelize.sync({ alter: true });
            logger.info('[Database] Models synchronized.');
        } catch (syncError) {
            logger.error('[Database] Model synchronization failed:', syncError);
            logger.warn('[Database] Proceeding with startup despite sync errors');
        }

        // 3. Initialize IPFS service
        try {
            await ipfsService.init();
            logger.info('[ipfsService] IPFS initialized successfully');
        } catch (ipfsError) {
            logger.error('[ipfsService] IPFS initialization failed:', ipfsError);
            logger.warn('[ipfsService] Proceeding without IPFS functionality');
        }

        // 4. Initialize blockchain service
        logger.info('[Startup] Initializing blockchain service...');
        try {
            await chain.initializeBlockchainService();
            logger.info('[Startup] Blockchain service initialization complete.');
        } catch (chainError) {
            logger.error('[Startup] Blockchain initialization failed:', chainError);
            logger.warn('[Startup] Proceeding without blockchain functionality');
        }

        // 5. Start scheduled jobs
        try {
            startScheduledScans();
            logger.info('[Startup] Scheduled jobs started.');
        } catch (cronError) {
            logger.error('[Startup] Failed to start scheduled jobs:', cronError);
        }

        // 6. Start HTTP server
        server.listen(PORT, '0.0.0.0', () => {
            logger.info(`[Express] Server is ready and running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        logger.error('[Startup] Fatal error during initialization:', error);
        logger.info(`[Startup] Retrying initialization in ${STARTUP_RETRY_DELAY / 1000}s...`);
        setTimeout(startServer, STARTUP_RETRY_DELAY);
    }
}

startServer().catch((error) => {
    logger.error('[FATAL] Error in startServer execution:', error);
    const retryDelay = parseInt(process.env.STARTUP_RETRY_DELAY_MS || '30000', 10);
    logger.info(`[Startup] Retrying initialization in ${retryDelay / 1000}s...`);
    setTimeout(startServer, retryDelay);
});
