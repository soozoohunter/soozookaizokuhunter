// express/models/index.js (v4.0 - Self-Diagnosing Final Version)
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger =require('../utils/logger');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: (msg) => logger.debug(msg), // 將 Sequelize 的日誌導向到 winston
  });
}

// [核心修正] 使用動態載入，但為每個模型加上獨立的錯誤捕獲
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.info(`[Database] Successfully loaded model: ${model.name} from ${file}`);
    } catch (error) {
      // 如果任何一個模型檔案在 require() 或初始化時出錯，我們能精準捕捉到
      logger.error(`[Database] FATAL: Failed to load model from file: ${file}`, error);
    }
  });

Object.keys(db).forEach(modelName => {
  try {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  } catch (error) {
    // 如果關聯設定出錯，我們也能精準捕捉
    logger.error(`[Database] FATAL: Failed to associate model: ${modelName}`, error);
  }
});

logger.info('[Database] Model association process completed.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
