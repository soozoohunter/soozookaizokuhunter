const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const protectRoutes = require('./routes/protectRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const fileRoutes = require('./routes/fileRoutes');
const scanRoutes = require('./routes/scanRoutes');

const { sequelize } = require('./models');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadDir));


// --- Routes ---
// The 'upload.single('file')' middleware will process a single file uploaded under the 'file' field name.
// It must be applied directly to the route that handles the upload.
app.use('/api/protect', upload.single('file'), protectRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/scans', scanRoutes);

// Database connection and server startup
sequelize.sync().then(() => {
    console.log('Database connected and synchronized.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is ready and running on http://0.0.0.0:${PORT}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
