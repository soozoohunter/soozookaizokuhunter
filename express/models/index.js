// express/models/index.js (v3.0 - Final, Stabilized Version)
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
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// [核心修正] 移除動態讀取檔案的邏輯，改為手動、明確地載入每一個模型。
// 這種方式雖然較為繁瑣，但極度穩定，且在出現問題時能提供清晰的錯誤堆疊。
db.User = require('./user.js')(sequelize, DataTypes);
db.SubscriptionPlan = require('./subscriptionplan.js')(sequelize, DataTypes);
db.UserSubscription = require('./usersubscription.js')(sequelize, DataTypes);
db.File = require('./file.js')(sequelize, DataTypes);
db.Scan = require('./scan.js')(sequelize, DataTypes);
db.UsageRecord = require('./usagerecord.js')(sequelize, DataTypes);
db.InfringementReport = require('./infringementreport.js')(sequelize, DataTypes);
db.DMCARequest = require('./dmcarequest.js')(sequelize, DataTypes);

// 假設您還有 ManualReport 和 Payment 模型，如果沒有請將其註解或刪除
// db.ManualReport = require('./manualreport.js')(sequelize, DataTypes);
// db.Payment = require('./payment.js')(sequelize, DataTypes);

logger.info('[Database] All models have been loaded explicitly.');

// 執行模型之間的關聯設定
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

logger.info('[Database] Model associations have been configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
