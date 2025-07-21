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
const chain = require('./utils/chain');

// --- Route Imports ---
// We will only import the primary route handlers.
// `protect.js` now handles uploads, certificate downloads, and scanning.
const protectRoutes = require('./routes/protect');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard'); // Keep for dashboard data

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);
// Note: Socket.IO initialization has been removed for simplification
// as it was not directly involved in the core errors. It can be re-added if needed.

// --- Middleware ---
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- File Upload (Multer) Setup ---
// Multer will save temporary files to a temp directory
const TEMP_DIR = path.join('/app/uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
const upload = multer({ dest: TEMP_DIR });

// --- Static File Serving ---
// Serve the entire /app/uploads directory so PDFs and other assets can be accessed
const UPLOAD_DIR = path.resolve('/app/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
logger.info(`[Setup] Static directory served at '/uploads' -> '${UPLOAD_DIR}'`);


// --- Route Definitions ---
// Apply the multer middleware `upload.single('file')` ONLY to the specific routes that handle file uploads.
// Since all upload logic is now in `protect.js`, we apply it there.
app.use('/api/protect', upload.single('file'), protectRoutes);

// Other routes do not need multer
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
    try {
        logger.info('[Startup] Connecting to database...');
        await db.sequelize.authenticate();
        logger.info('[Database] Connection established.');

        // Using alter:true is okay for development but be cautious in production
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

startServer();
