'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize } = require('sequelize');

// 從環境或 .env 取得連線字串
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}`
  + `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 Sequelize 實例
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false, // 可視需求調整
});

// ★ 手動匯入各個 Model
const User = require('./User')(sequelize, Sequelize.DataTypes);
// 若有其他 Model, ex:
const File = require('./File')(sequelize, Sequelize.DataTypes);

// 若有 Payment, Infringement, etc.
// const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);

// 建立關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 若有 Payment, Infringement, etc. 也可在此做關聯

module.exports = {
  sequelize,
  User,
  File,
  // Payment,
  // Infringement,
};
