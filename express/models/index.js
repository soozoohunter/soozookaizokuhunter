// express/models/index.js (v9.0 - The Monolith, The Final Stand)
'use strict';

const { Sequelize, DataTypes, Model } = require('sequelize');
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
    define: {
      underscored: true,
      freezeTableName: true, 
    }
  });
}

// =============================================================================
// [核心修正] 所有模型定義全部集中於此，消除所有外部檔案依賴
// =============================================================================

// --- User Model ---
class User extends Model {}
User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    username: DataTypes.STRING,
    realName: DataTypes.STRING,
    birthDate: DataTypes.DATE,
    address: DataTypes.STRING,
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    image_upload_limit: DataTypes.INTEGER,
    scan_limit_monthly: DataTypes.INTEGER,
    dmca_takedown_limit_monthly: DataTypes.INTEGER,
}, { sequelize, modelName: 'User', tableName: 'Users' });
db[User.name] = User;

// --- File Model ---
class File extends Model {}
File.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    filename: DataTypes.STRING,
    title: DataTypes.STRING,
    keywords: DataTypes.TEXT,
    mime_type: DataTypes.STRING,
    fingerprint: { type: DataTypes.STRING, unique: true },
    ipfs_hash: DataTypes.STRING,
    tx_hash: DataTypes.STRING,
    thumbnail_path: { type: DataTypes.STRING, allowNull: true },
    status: DataTypes.STRING,
}, { sequelize, modelName: 'File', tableName: 'Files' });
db[File.name] = File;

// --- Scan Model ---
class Scan extends Model {}
Scan.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    file_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    result: { type: DataTypes.JSONB, allowNull: true },
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE
}, { sequelize, modelName: 'Scan', tableName: 'Scans' });
db[Scan.name] = Scan;

// --- UsageRecord Model ---
class UsageRecord extends Model {}
UsageRecord.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    feature_code: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, modelName: 'UsageRecord', tableName: 'UsageRecords' });
db[UsageRecord.name] = UsageRecord;

// =============================================================================
// 關聯定義 (Associations)
// =============================================================================
logger.info('[Database] Defining model associations...');

db.User.hasMany(db.File, { foreignKey: 'user_id', as: 'files' });
db.File.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.User.hasMany(db.Scan, { foreignKey: 'user_id', as: 'scans' });
db.Scan.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.File.hasMany(db.Scan, { foreignKey: 'file_id', as: 'scans' });
db.Scan.belongsTo(db.File, { foreignKey: 'file_id', as: 'file' });

db.User.hasMany(db.UsageRecord, { foreignKey: 'user_id', as: 'usageRecords' });
db.UsageRecord.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

logger.info('[Database] Model association process completed.');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
