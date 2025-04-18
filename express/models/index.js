'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize } = require('sequelize');

// 連線字串
const DB_URL = process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false,
});

// ★ 手動匯入
const User = require('./User')(sequelize, Sequelize.DataTypes);
const File = require('./File')(sequelize, Sequelize.DataTypes);

// ★ 若您有其他 Model, ex: Payment, Infringement, 也在這裡手動匯入
// const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
// const Infringement = require('./Infringement')(sequelize, Sequelize.DataTypes);

// 關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 如果還有 Payment, Infringement, 也可做關聯

module.exports = {
  sequelize,
  User,
  File,
  // Payment,
  // Infringement,
};
