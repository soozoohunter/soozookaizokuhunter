// express/server.js (路徑修正版)
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { initSocket } = require('./socket');
const db = require('./models');

// --- Routers ---
const authRouter = require('./routes/auth');
const protectRouter = require('./routes/protect');
// ... (保留您其他的 router require) ...
const filesRouter = require('./routes/files');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');


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

// --- [修正] 使用單一、明確的路徑來提供靜態檔案服務 ---
// 根據 Docker 的結構，專案根目錄會是 /app
// 因此，實體路徑應該是 /app/uploads
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/protect', protectRouter);
// ... (保留您其他的 app.use for routers) ...
app.use('/api/files', filesRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.EXPRESS_PORT || 3000;

async function startServer() {
    // ... (保留您原有的 startServer 函式內容)
    try {
        logger.info('[Startup] Step 1: Initializing Database connection...');
        await db.sequelize.authenticate();
        logger.info('[Startup] Step 1: Database connection successful.');

        // ...其他啟動步驟...

        server.listen(PORT, () => {
            logger.info(`[Express] Server with Socket.IO is ready and running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        logger.error('[Startup] Failed to start Express server:', error);
        process.exit(1);
    }
}

startServer();
