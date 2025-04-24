'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');

// 連線字串
const DB_URL = process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  logging: false
});

// 載入 Model
const User = require('./User')(sequelize, DataTypes);
const File = require('./File')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Infringement = require('./Infringement')(sequelize, DataTypes);
// ... 若有更多 model，一併 require

// 這裡可做關聯 (association)
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Infringement, { foreignKey: 'userId' });
Infringement.belongsTo(User, { foreignKey: 'userId' });

// 匯出
module.exports = {
  sequelize,
  User,
  File,
  Payment,
  Infringement
  // ... 也可 export 其他
};
