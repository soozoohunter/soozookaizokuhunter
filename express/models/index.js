'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../utils/logger');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

// 核心修复：使用更可靠的连接方式
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: (msg) => logger.debug(msg),
  define: {
    freezeTableName: true, // 禁止复数化表名
    underscored: true,    // 使用下划线命名风格
    timestamps: true,     // 统一启用时间戳
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 动态加载所有模型
fs.readdirSync(__dirname)
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
      logger.info(`[Database] Loaded model: ${model.name}`);
    } catch (error) {
      logger.error(`[Database] Failed to load model ${file}:`, error);
      process.exit(1);
    }
  });

// 配置关联关系
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 核心修复：统一表名大小写处理
db.User = sequelize.models.User;
db.File = sequelize.models.File;
db.Scan = sequelize.models.Scan;
db.UsageRecord = sequelize.models.UsageRecord;

// 测试连接
sequelize.authenticate()
  .then(() => logger.info('[Database] Connection established successfully.'))
  .catch(err => {
    logger.error('[Database] Unable to connect:', err);
    process.exit(1);
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
