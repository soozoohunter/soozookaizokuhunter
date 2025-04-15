require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// 從環境變數讀取資料庫連線設定
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // 關閉 SQL 日誌（視需求開啟）
  }
);

// 動態讀取當前目錄下其他模型檔案並初始化
const db = {};
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// 如果模型間有關聯，在這裡調用 associate
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 匯出資料庫連線和所有模型
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
