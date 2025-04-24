'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

// 讀取 DB 連線設定 (Postgres)
const dbHost = process.env.DB_HOST || 'suzoo_postgres';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'mydatabase';
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgres';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false
});

const db = {};
db.sequelize = sequelize;

// Import Models
const UserModel = require('./User')(sequelize, Sequelize.DataTypes);
const FileModel = require('./File')(sequelize, Sequelize.DataTypes);

db.User = UserModel;
db.File = FileModel;

// 關聯
db.User.hasMany(db.File, { foreignKey: 'user_id' });
db.File.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
