'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
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

try {
    db.User = require('./user.js')(sequelize, DataTypes);
    db.SubscriptionPlan = require('./subscriptionplan.js')(sequelize, DataTypes);
    db.UserSubscription = require('./usersubscription.js')(sequelize, DataTypes);
    db.File = require('./file.js')(sequelize, DataTypes);
    db.Scan = require('./scan.js')(sequelize, DataTypes);
    db.UsageRecord = require('./usagerecord.js')(sequelize, DataTypes);
    db.InfringementReport = require('./infringementreport.js')(sequelize, DataTypes);
    db.DMCARequest = require('./dmcarequest.js')(sequelize, DataTypes);
    logger.info('[Database] All primary models loaded successfully.');
} catch (error) {
    logger.error('[Database] FATAL: A critical model failed to load. Please check filenames and content.', error);
    throw error;
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
logger.info('[Database] Model associations configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
