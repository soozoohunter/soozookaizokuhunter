/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model
 ********************************************************************/
const { Sequelize } = require('sequelize');
const path = require('path');

// 注意：如果您要讀取 .env，也請確保 .env 存在並能被 Docker 正確帶入
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// 確認從 .env 中獲取正確的 Postgres 連線資訊
// 如果沒有 DATABASE_URL，就組合成 `postgres://${user}:${pass}@host:port/db`
const DB_URL =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false, // 生產環境可改成 true or 使用自訂 logger
});

// 匯入 Model
const User = require('./User')(sequelize);
const File = require('./File')(sequelize);
// 若有更多 Model (Payment / Infringement etc.) 也可在此匯入

// 建立關聯
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// 匯出所有
module.exports = {
  sequelize,
  User,
  File,
};
