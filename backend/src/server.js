const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const protectRoutes = require('./routes/protectRoutes');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes'); // [★★ ADD THIS ★★]

const { sequelize } = require('./models');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({ dest: '/app/uploads/temp' });

// --- Routes ---
app.use('/api/protect', upload.single('file'), protectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes); // [★★ ADD THIS ★★]

sequelize.sync().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is ready and running on http://0.0.0.0:${PORT}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
