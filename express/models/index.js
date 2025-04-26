'use strict';
const path = require('path');
require('dotenv').config({
  // 尋找兩層上級目錄的 .env；若 docker-compose 已自動注入，可視需要調整
  path: path.join(__dirname, '..', '..', '.env')
});

const { Sequelize, DataTypes } = require('sequelize');

// 從環境變數讀取
const user = process.env.POSTGRES_USER;
const pass = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = process.env.POSTGRES_PORT;
const db   = process.env.POSTGRES_DB;

// 優先使用 DATABASE_URL，否則組合 postgresql://user:pass@host:port/db
const DB_URL = process.env.DATABASE_URL
  || `postgresql://${user}:${pass}@${host}:${port}/${db}`;

// 建立 Sequelize 連線
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false
});

// 載入 Model
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
// 如果還有其他 Model (e.g. Payment.js, Infringement.js)，都在此引入

// 關聯
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// 最後匯出
module.exports = {
  sequelize,
  User,
  File
  // 若有更多 Model，就在此 export
};
