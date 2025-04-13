// express/models/index.js
const Sequelize = require('sequelize');

// 如果您 .env 有 DB 資訊，或 config 檔有 DB_URL
// 例如 process.env.DB_URL = 'postgres://user:pass@host:5432/dbname'
const DB_URL = process.env.DB_URL || 'postgres://user:pass@localhost:5432/mydb';

const sequelize = new Sequelize(DB_URL, {
  logging: false, 
  dialectOptions: {
    ssl: false // 若您需要 SSL，可設定 true
  }
});

// 匯入個別 Model
const User = require('./User')(sequelize, Sequelize.DataTypes);
const VerificationCode = require('./VerificationCode')(sequelize, Sequelize.DataTypes);

// 如果有其他 Model 也可在此匯入

// 匯出
module.exports = {
  sequelize,
  User,
  VerificationCode
};
