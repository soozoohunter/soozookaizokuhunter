'use strict';

const { Sequelize, DataTypes, Model } = require('sequelize');
const logger = require('../utils/logger');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];

// 创建 sequelize 实例 - 简化配置
const sequelize = new Sequelize({
  database: config.database,
  username: config.username,
  password: config.password,
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: msg => logger.debug(`[Sequelize] ${msg}`),
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true
  }
});

// 模型定义 - 仅包含核心模型
class User extends Model {}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' }
}, { sequelize, modelName: 'User', tableName: 'users' });

class File extends Model {}
File.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  filename: DataTypes.STRING,
  fingerprint: { type: DataTypes.STRING, unique: true }
}, { sequelize, modelName: 'File', tableName: 'files' });

// 关联关系
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// 导出对象
const db = {
  sequelize,
  Sequelize,
  User,
  File
};

// 简化同步逻辑
sequelize.authenticate()
  .then(() => {
    logger.info('[Database] Connection established');
    return Promise.all([
      User.sync({ alter: true }),
      File.sync({ alter: true })
    ]);
  })
  .then(() => {
    logger.info('[Database] Core tables synchronized');
  })
  .catch(err => {
    logger.error('[Database] Fatal initialization error:', err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

module.exports = db;
