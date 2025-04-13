const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // 載入環境變數
const express = require('express');
const app = express();
const routes = require('./MyRoutes');
// 如有需要可引入 CORS 中介軟體：const cors = require('cors');

const PORT = process.env.PORT || 5000;

// 中介軟體設定
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 開發環境若需要跨源訪問 API，可啟用 CORS：app.use(cors());

// 掛載路由
app.use('/', routes);

// 健康檢查端點（供健康檢查或監控使用）
app.get('/health', (req, res) => res.send('OK'));

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});
