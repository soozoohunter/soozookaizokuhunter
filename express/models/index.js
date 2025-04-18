'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

// 以目前檔名為基準 (index.js)
const basename = path.basename(__filename);

// 載入 .env
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// 連線字串
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  logging: false,
  dialect: 'postgres'
});

const db = {};

// 自動掃描該資料夾下所有 .js (排除 index.js)
fs
  .readdirSync(__dirname)
  .filter(file => {
    // 排除隱藏檔、排除 index.js 自己、僅限 .js
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    // 依序 require 該檔案並傳入 (sequelize, Sequelize.DataTypes)
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// 執行關聯
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 匯出
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
