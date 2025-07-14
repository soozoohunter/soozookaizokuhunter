// express/models/index.js (最終修正版)
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../utils/logger');
const basename = path.basename(__filename);
const db = {};

// [優化] 直接從 .env 讀取設定，這比依賴外部的 config/database.js 更適合 Docker 環境
const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD, {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    // 關閉 Sequelize 的 SQL 日誌，除非您需要調試，否則可保持控制台乾淨
    logging: false,
    // 保留您原有的良好全域設定
    define: {
      freezeTableName: true, // 禁止 Sequelize 自動將表名變為複數
      underscored: true,     // 自動將駝峰式命名的欄位轉為底線式
      timestamps: true,      // 自動加入 createdAt 和 updatedAt 欄位
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// 讀取 models 目錄下的所有檔案
fs.readdirSync(__dirname)
  .filter(file => {
    // 標準過濾條件：不是隱藏檔、不是 index.js 本身、是 .js 檔案
    const isVisibleFile = file.indexOf('.') !== 0;
    const isNotThisFile = file !== basename;
    const isJsFile = file.slice(-3) === '.js';
    
    return isVisibleFile && isNotThisFile && isJsFile;
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } catch (error) {
      // 如果載入模型失敗，提供更詳細的錯誤日誌並退出
      logger.error(`[Database] CRITICAL: Failed to load model from file ${file}.`, error);
      process.exit(1);
    }
  });

// 建立模型間的關聯
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 測試資料庫連線
sequelize.authenticate()
  .then(() => logger.info('[Database] Connection has been established successfully.'))
  .catch(err => {
    logger.error('[Database] CRITICAL: Unable to connect to the database:', err);
    process.exit(1); // 連線失敗則直接退出，避免服務處於不穩定狀態
  });


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
