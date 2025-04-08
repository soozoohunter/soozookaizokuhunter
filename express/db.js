// express/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 若 .env 中有設定 DATABASE_URL (格式例: "postgres://user:pass@host:5432/dbname")
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // 依需求開啟/關閉
});

// 如果您想針對 .env 中的 POSTGRES_* 進行 fallback，可這樣寫：
// const sequelize = new Sequelize(
//   process.env.POSTGRES_DB || 'mydb',
//   process.env.POSTGRES_USER || 'postgres',
//   process.env.POSTGRES_PASSWORD || '',
//   {
//     host: process.env.POSTGRES_HOST || 'suzoo_postgres',
//     port: process.env.POSTGRES_PORT || 5432,
//     dialect: 'postgres',
//     logging: false
//   }
// );

module.exports = sequelize;
