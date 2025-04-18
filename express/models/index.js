/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model
 ********************************************************************/
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// 從環境變數或 .env 載入資料庫連線資訊
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  logging: false,      // 關閉 SQL log
  dialect: 'postgres', // 明確指定方言
});

// 匯入 Model
const User = require('./User')(sequelize);
const File = require('./File')(sequelize);
// 如果有 Payment / Infringement Model, 亦可在這裡繼續 import

// 建立關聯 (User 1 - n File)
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 匯出
module.exports = {
  sequelize,
  User,
  File,
};
