// models/index.js
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize } = require('sequelize');

// 讀取連線字串
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false,
});

// ★ 手動 require
const User = require('./User')(sequelize, Sequelize.DataTypes);
const File = require('./File')(sequelize, Sequelize.DataTypes);

// 關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

module.exports = {
  sequelize,
  User,
  File,
};
