'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../utils/logger');

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
    logging: (msg) => logger.debug(`[Sequelize] ${msg}`),
  });
}

// 統一使用小寫檔名進行引入
const modelsToLoad = [
  'user', 'subscriptionplan', 'usersubscription', 'file', 'scan',
  'usagerecord', 'infringementreport', 'dmcarequest',
  'manualreport', 'payment'
];

modelsToLoad.forEach(modelFile => {
  const filePath = path.join(__dirname, `${modelFile}.js`);
  if (fs.existsSync(filePath)) {
    try {
      const model = require(filePath)(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.info(`[Database] Successfully loaded model: ${model.name} from ${modelFile}.js`);
    } catch (error) {
      logger.error(`[Database] FATAL: Failed to load model from file: ${modelFile}.js`, error);
      throw error;
    }
  }
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
logger.info('[Database] Model associations configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
