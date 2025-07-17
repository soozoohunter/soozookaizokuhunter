'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../utils/logger'); // 引入您的 logger
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
    define: {
      freezeTableName: true, // 禁止 Sequelize 自動將表名變為複數
      underscored: true,     // 自動將駝峰式命名的欄位轉為底線式
      timestamps: true,      // 自動加入 createdAt 和 updatedAt 欄位
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// [★★ 關鍵修正 1 ★★] 自動讀取當前目錄下的所有模型檔案，並初始化
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } catch (error) {
      logger.error(`[Database] CRITICAL: Failed to load model from file ${file}.`, error);
      process.exit(1);
    }
  });

// [★★ 關鍵修正 2 ★★] 在所有模型都載入後，才執行模型間的關聯設定
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
