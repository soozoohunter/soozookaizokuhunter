'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: msg => logger.debug(`[Sequelize] ${msg}`),
    define: {
      underscored: true,
      freezeTableName: false
    }
  }
);

const modelFiles = [
  'User.js',
  'File.js',
  'scan.js',
  'usagerecord.js',
  'subscriptionplan.js',
  'usersubscription.js',
  'infringementreport.js',
  'dmcarequest.js',
  'ManualReport.js',
  'Payment.js',
  'ScanTask.js'
];

modelFiles.forEach(file => {
  const modelPath = path.join(__dirname, file);
  if (fs.existsSync(modelPath)) {
    try {
      const model = require(modelPath)(sequelize, DataTypes);
      db[model.name] = model;
      logger.info(`[Database] Loaded model: ${model.name}`);
    } catch (error) {
      logger.error(`[Database] Failed to load model ${file}:`, error);
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
