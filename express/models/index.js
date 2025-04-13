/********************************************************************
 * express/models/index.js (最終版, 可直接覆蓋)
 ********************************************************************/
const Sequelize = require('sequelize');

// 如果您 .env 有 DB_URL，例如：DB_URL=postgres://user:pass@host:5432/dbname
// 沒有的話，就改為硬寫 or docker-compose 以 environment 方式注入
const DB_URL = process.env.DB_URL || 'postgres://user:pass@localhost:5432/mydb';

const sequelize = new Sequelize(DB_URL, {
  logging: false,
  dialectOptions: {
    ssl: false // 若需 SSL，可設 true
  }
});

// 匯入個別 Model
const User = require('./User')(sequelize, Sequelize.DataTypes);
// ↓ VerificationCode 若非 Sequelize Model，就不載了
// const VerificationCode = require('./VerificationCode')(sequelize, Sequelize.DataTypes);

// 可在此繼續匯入其他 Model
// e.g. const Post = require('./Post')(sequelize, Sequelize.DataTypes);

module.exports = {
  sequelize,
  User
  // VerificationCode (若您沒將它定義成 Sequelize model，就不需要匯出)
};
