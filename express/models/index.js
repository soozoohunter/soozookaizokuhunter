/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model
 ********************************************************************/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { Sequelize, DataTypes } = require('sequelize');

const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(DB_URL, {
  logging: false,
  dialect: 'postgres'
});

// 匯入 Model，確保把 (sequelize, DataTypes) 傳進去
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
// 如果有 Payment / Infringement Model, 亦可在這裡繼續 import

// 建立關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 匯出
module.exports = {
  sequelize,
  User,
  File
};
