// express/db.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // 可根據需求設定
  // 若您的環境無 DATABASE_URL，可使用以下方式：
  // database: process.env.POSTGRES_DB,
  // username: process.env.POSTGRES_USER,
  // password: process.env.POSTGRES_PASSWORD,
  // host: process.env.POSTGRES_HOST,
  // port: process.env.POSTGRES_PORT,
});

module.exports = sequelize;