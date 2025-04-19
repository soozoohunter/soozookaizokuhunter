'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');

//---------------------
// 環境變數 + fallback
//---------------------
const DB_URL = process.env.DATABASE_URL 
  || 'postgresql://suzoo:KaiShieldDbPass2023!@suzoo_postgres:5432/suzoo';

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false
});

// 載入 Model
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);

// 若有更多 Model (ex. Payment, Infringement) 也可在這裡 require

// 建立關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 匯出
module.exports = {
  sequelize,
  User,
  File
};
