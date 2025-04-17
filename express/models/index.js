/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model
 ********************************************************************/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// 同時匯入 Sequelize 與 DataTypes
const { Sequelize, DataTypes } = require('sequelize');

const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false, // 需求可改 true
});

// 匯入 Model，注意要把 `DataTypes` 一併傳給工廠函式
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
// 若有更多 Model（如 Payment、Infringement 等）也可在此匯入

// 建立關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 匯出
module.exports = {
  sequelize,
  User,
  File,
};
