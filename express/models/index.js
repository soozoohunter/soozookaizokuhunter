'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger'); // 引入 logger

// --- 1. 資料庫連線設定 (保留您原有的簡潔方式) ---
const DB_URL = process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

if (!process.env.POSTGRES_USER || !process.env.POSTGRES_DB) {
    logger.error('[Database] Critical environment variables for database connection are missing (POSTGRES_USER, POSTGRES_DB).');
    throw new Error('Database configuration is incomplete.');
}

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false, // 在生產環境中建議關閉或導向到 logger.debug
});

// --- 2. 明確載入所有模型 (最穩定的方式) ---
const db = {};

db.User = require('./User')(sequelize, DataTypes);
db.File = require('./File')(sequelize, DataTypes);
db.ScanTask = require('./ScanTask')(sequelize, DataTypes);
db.Scan = require('./scan')(sequelize, DataTypes);
db.ManualReport = require('./ManualReport')(sequelize, DataTypes);
// 如果未來有其他模型，例如 Payment.js，請在此處手動加入：
// db.Payment = require('./Payment')(sequelize, DataTypes);

logger.info('[Database] All models loaded successfully.');

// --- 3. 建立模型關聯 ---
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
logger.info('[Database] Model associations configured.');

// --- 4. 新增關鍵的資料庫連接函式 ---
const connectToDatabase = async (retries = 10, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('[Database] Connection has been established successfully.');
      return;
    } catch (error) {
      logger.error(`[Database] Unable to connect. Attempt ${i}/${retries}. Retrying in ${delay / 1000}s...`, { error: error.message });
      if (i === retries) {
        logger.error('[Database] All attempts to connect to the database have failed.');
        throw error;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// --- 5. 匯出所有需要的模組 ---
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.connectToDatabase = connectToDatabase;

module.exports = db;
