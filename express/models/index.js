/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model
 ********************************************************************/
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

// 當前檔名(如 index.js)
const basename = path.basename(__filename);

// 載入 .env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// 從環境變數或 .env 載入資料庫連線資訊
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  logging: false,      // 關閉 SQL log
  dialect: 'postgres', // 明確指定方言
});

const db = {};

// 讀取 models 目錄下所有 *.js，但排除 index.js 本身
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&           // 排除隱藏檔
      file !== basename &&                // 排除 index.js 自己
      file.slice(-3) === '.js'            // 只讀取 .js 檔
    );
  })
  .forEach(file => {
    // 依序載入並執行「(sequelize, Sequelize.DataTypes) => {...}」
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// 若有關聯 (associate)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 匯出
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
