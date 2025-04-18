/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 匯出 Model（完全自動載入所有 models/*.js）
 ********************************************************************/
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const sequelize = new Sequelize(
  process.env.DATABASE_URL ||
    `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
    `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
  {
    dialect: 'postgres',
    logging: false,
  }
);

// 動態匯入 models
const db = {};
const basename = path.basename(__filename);
fs.readdirSync(__dirname)
  .filter(file => file !== basename && file.endsWith('.js'))
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    const model = modelDef(sequelize, DataTypes);
    db[model.name] = model;
  });

// 建立所有關聯（若 model 定義了 associate）
Object.keys(db).forEach(name => {
  if (db[name].associate) db[name].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
