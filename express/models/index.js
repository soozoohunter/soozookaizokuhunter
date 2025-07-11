// express/models/index.js (v7.0 - The Final Stand)
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

try {
    // [核心修正] 根據您的伺服器檔案結構，明確指定所有模型的大小寫檔名
    db.User = require('./user.js')(sequelize, Sequelize.DataTypes);
    db.File = require('./file.js')(sequelize, Sequelize.DataTypes);
    db.Scan = require('./scan.js')(sequelize, Sequelize.DataTypes);
    db.UsageRecord = require('./usagerecord.js')(sequelize, Sequelize.DataTypes);
    db.SubscriptionPlan = require('./subscriptionplan.js')(sequelize, Sequelize.DataTypes);
    db.UserSubscription = require('./usersubscription.js')(sequelize, Sequelize.DataTypes);
    db.InfringementReport = require('./infringementreport.js')(sequelize, Sequelize.DataTypes);
    db.DMCARequest = require('./dmcarequest.js')(sequelize, Sequelize.DataTypes);

    // 檢查並載入其他可能存在的模型
    if (fs.existsSync(path.join(__dirname, 'manualreport.js'))) {
        db.ManualReport = require('./manualreport.js')(sequelize, Sequelize.DataTypes);
    }
    if (fs.existsSync(path.join(__dirname, 'payment.js'))) {
        db.Payment = require('./payment.js')(sequelize, Sequelize.DataTypes);
    }
     if (fs.existsSync(path.join(__dirname, 'ScanTask.js'))) {
        db.ScanTask = require('./ScanTask.js')(sequelize, Sequelize.DataTypes);
    }

    logger.info('[Database] All models have been loaded explicitly and successfully.');

} catch (error) {
    logger.error(`[Database] FATAL: A critical model failed to load. Please check filenames and their content. Error:`, error);
    // 啟動失敗時，直接拋出錯誤，避免容器無限重啟
    throw error;
}


// 執行模型之間的關聯設定
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

logger.info('[Database] Model associations configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
