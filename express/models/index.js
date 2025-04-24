'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');

// 連線字串
const DB_URL = process.env.DATABASE_URL
  || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// 建立 sequelize 連線
const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false
});

// 載入 Model
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
// 若有 Payment, Infringement... 也可在此引入

// 關聯
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// 若有 Payment, Infringement... 在此做關聯
// ...

module.exports = {
  sequelize,
  User,
  File
  // Payment, ...
};
