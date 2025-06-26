'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger'); // 引入 logger

// --- 1. 資料庫連線設定 (保留您現有的簡潔方式) ---
// 優先使用 DATABASE_URL，若無則從其他 POSTGRES_ 變數組合
const DB_URL = process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

if (!DB_URL.includes(process.env.POSTGRES_USER)) {
    logger.error('[Database] Database connection string is invalid or missing credentials.');
    // 在無法建立有效連線字串時拋出錯誤，防止後續失敗
    throw new Error('Could not construct a valid DATABASE_URL.');
}

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(`[Sequelize] ${msg}`), // 將 Sequelize 的日誌透過 logger 輸出
});

const db = {};
const basename = path.basename(__filename);

// --- 2. 動態讀取所有模型檔案 (採用更具擴展性的方式) ---
fs
  .readdirSync(__dirname)
  .filter(file => {
    // 篩選出所有 .js 結尾的模型檔案，排除自己 (index.js) 和測試檔
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      !file.includes('.test.js')
    );
  })
  .forEach(file => {
    // 載入模型定義，並將其加入 db 物件中
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    logger.info(`[Database] Model loaded: ${model.name}`);
  });

// --- 3. 動態建立模型關聯 ---
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
    logger.info(`[Database] Associations configured for model: ${modelName}`);
  }
});

// --- 4. 新增關鍵的資料庫連接函式 (解決伺服器啟動失敗問題) ---
/**
 * 連接並驗證資料庫連線，包含重試機制。
 * 這是為了確保在主應用程式啟動前，資料庫已經準備就緒。
 */
const connectToDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('[Database] Connection has been established successfully.');
      return; // 連接成功，退出函式
    } catch (error) {
      logger.error(`[Database] Unable to connect to the database. Attempt ${i}/${retries}. Retrying in ${delay / 1000}s...`, { error: error.message });
      if (i === retries) {
        logger.error('[Database] All attempts to connect to the database have failed.');
        throw error; // 重試全部失敗後，拋出錯誤以中斷伺服器啟動
      }
      // 等待後重試
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// --- 5. 匯出所有需要的模組 ---
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.connectToDatabase = connectToDatabase; // 將連接函式也匯出

module.exports = db;
