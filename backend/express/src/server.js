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

// --- 中間件 ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 Multer 用於文件上傳
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// 提供靜態文件服務（上傳的文件）
app.use('/uploads', express.static(uploadDir));

// --- 路由 ---
app.use('/api/protect', upload.single('file'), protectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/scans', scanRoutes);

// 數據庫連接和服務器啟動
sequelize.sync().then(() => {
    console.log('數據庫已連接並同步。');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服務器運行在 http://0.0.0.0:${PORT}`);
    });
}).catch(err => {
    console.error('無法連接到數據庫:', err);
});
