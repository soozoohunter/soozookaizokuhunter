// express/models/index.js (v3.2 - Case-Sensitivity Final Fix)
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
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// [核心修正] 移除動態讀取，改為手動、明確地載入每一個模型，並使用正確的 PascalCase 檔名。
db.User = require('./User.js')(sequelize, Sequelize.DataTypes);
db.File = require('./File.js')(sequelize, Sequelize.DataTypes);
db.Scan = require('./scan.js')(sequelize, Sequelize.DataTypes); // 保持小寫，因您上次的檔案是小寫
db.UsageRecord = require('./usagerecord.js')(sequelize, Sequelize.DataTypes); // 保持小寫
db.SubscriptionPlan = require('./subscriptionplan.js')(sequelize, Sequelize.DataTypes); // 保持小寫
db.UserSubscription = require('./usersubscription.js')(sequelize, Sequelize.DataTypes); // 保持小寫
db.InfringementReport = require('./infringementreport.js')(sequelize, Sequelize.DataTypes); // 保持小寫
db.DMCARequest = require('./dmcarequest.js')(sequelize, Sequelize.DataTypes); // 保持小寫

// 假設您還有 ManualReport 和 Payment 模型，如果沒有請將其註解或刪除
// 注意檔名的大小寫
if (fs.existsSync(path.join(__dirname, 'ManualReport.js'))) {
    db.ManualReport = require('./ManualReport.js')(sequelize, Sequelize.DataTypes);
}
if (fs.existsSync(path.join(__dirname, 'Payment.js'))) {
    db.Payment = require('./Payment.js')(sequelize, Sequelize.DataTypes);
}

logger.info('[Database] All models have been loaded explicitly.');

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

logger.info('[Database] Model associations have been configured.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
