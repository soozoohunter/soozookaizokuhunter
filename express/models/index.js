'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: (msg) => logger.debug(msg),
  define: {
    underscored: true,
    freezeTableName: true,
  }
});

const modelsToLoad = [
    'User', 'File', 'Scan', 'UsageRecord',
    'SubscriptionPlan', 'UserSubscription',
    'InfringementReport', 'DMCARequest'
];

modelsToLoad.forEach(modelName => {
    try {
        const modelPath = path.join(__dirname, `${modelName}.js`);
        if (fs.existsSync(modelPath)) {
            const model = require(modelPath)(sequelize, DataTypes);
            db[model.name] = model;
        }
    } catch (error) {
        logger.error(`[Database] FATAL: Failed to load model: ${modelName}`, error);
        throw error;
    }
});

logger.info(`[Database] All models loaded: ${Object.keys(db).join(', ')}`);

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
logger.info('[Database] Model associations configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
