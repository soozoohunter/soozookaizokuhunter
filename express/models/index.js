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
// [核心修正] 所有模型定义全部集中于此，消除所有外部文件依赖
// =============================================================================

// 1. User 模型定义
class User extends Model {
  static associate(models) {
    User.hasMany(models.File, { foreignKey: 'user_id', as: 'files' });
    User.hasMany(models.Scan, { foreignKey: 'user_id', as: 'scans' });
    User.hasMany(models.UsageRecord, { foreignKey: 'user_id', as: 'usageRecords' });
    User.hasMany(models.DMCARequest, { foreignKey: 'user_id', as: 'dmcaRequests' });
    User.hasMany(models.InfringementReport, { 
      foreignKey: 'user_id', 
      as: 'infringementReports' 
    });
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING,
    unique: true
  },
  realName: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  IG: DataTypes.STRING,
  FB: DataTypes.STRING,
  YouTube: DataTypes.STRING,
  TikTok: DataTypes.STRING,
  image_upload_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  scan_limit_monthly: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  dmca_takedown_limit_monthly: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_upload_usage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  scan_usage_monthly: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  scan_usage_reset_at: DataTypes.DATE
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users'
});

// 2. File 模型定义
class File extends Model {
  static associate(models) {
    File.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    File.hasMany(models.Scan, { foreignKey: 'file_id', as: 'scans' });
  }
}

File.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  filename: DataTypes.STRING,
  title: DataTypes.STRING,
  keywords: DataTypes.TEXT,
  mime_type: DataTypes.STRING,
  fingerprint: {
    type: DataTypes.STRING,
    unique: true
  },
  ipfs_hash: DataTypes.STRING,
  tx_hash: DataTypes.STRING,
  thumbnail_path: DataTypes.STRING,
  status: DataTypes.STRING,
  report_url: DataTypes.STRING,
  resultJson: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'File',
  tableName: 'files',
  timestamps: true
});

// 3. Scan 模型定义
class Scan extends Model {
  static associate(models) {
    Scan.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    Scan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Scan.hasMany(models.DMCARequest, { 
      foreignKey: 'scan_id', 
      as: 'dmcaRequests' 
    });
    Scan.hasMany(models.InfringementReport, { 
      foreignKey: 'scan_id', 
      as: 'infringementReports' 
    });
  }
}

Scan.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'files',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  result: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  started_at: DataTypes.DATE,
  completed_at: DataTypes.DATE
}, {
  sequelize,
  modelName: 'Scan',
  tableName: 'scans'
});

// 4. 其他核心模型定义
class UsageRecord extends Model {
  static associate(models) {
    UsageRecord.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  }
}

UsageRecord.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  feature_code: {
    type: DataTypes.ENUM('image_upload', 'scan', 'dmca_takedown'),
    allowNull: false
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  period_start: DataTypes.DATE,
  period_end: DataTypes.DATE,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'UsageRecord',
  tableName: 'usage_records',
  timestamps: false
});

class DMCARequest extends Model {
  static associate(models) {
    DMCARequest.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    DMCARequest.belongsTo(models.Scan, { 
      foreignKey: 'scan_id', 
      as: 'scan' 
    });
    DMCARequest.belongsTo(models.InfringementReport, { 
      foreignKey: 'report_id', 
      as: 'report' 
    });
  }
}

DMCARequest.init({
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: DataTypes.INTEGER,
  scan_id: DataTypes.INTEGER,
  report_id: DataTypes.INTEGER,
  infringing_url: DataTypes.STRING,
  status: DataTypes.ENUM('pending','submitted','completed','failed'),
  dmca_case_id: DataTypes.STRING,
  submitted_at: DataTypes.DATE
}, {
  sequelize,
  modelName: 'DMCARequest',
  tableName: 'dmca_requests'
});

class InfringementReport extends Model {
  static associate(models) {
    InfringementReport.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    InfringementReport.belongsTo(models.Scan, { 
      foreignKey: 'scan_id', 
      as: 'scan' 
    });
    InfringementReport.hasMany(models.DMCARequest, { 
      foreignKey: 'report_id', 
      as: 'dmcaRequests' 
    });
  }
}

InfringementReport.init({
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: DataTypes.INTEGER,
  scan_id: DataTypes.INTEGER,
  links_confirmed: DataTypes.JSONB,
  status: DataTypes.STRING
}, {
  sequelize,
  modelName: 'InfringementReport',
  tableName: 'infringement_reports'
});

// =============================================================================
// 模型关联设置
// =============================================================================

// 设置所有关联关系
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 导出模型
db.User = User;
db.File = File;
db.Scan = Scan;
db.UsageRecord = UsageRecord;
db.DMCARequest = DMCARequest;
db.InfringementReport = InfringementReport;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// =============================================================================
// 数据库同步
// =============================================================================

if (process.env.NODE_ENV !== 'production') {
  sequelize.sync({ alter: true })
    .then(() => logger.info('[Database] Tables synchronized successfully'))
    .catch(err => logger.error('[Database] Sync error:', err));
}

logger.info('[Database] All models and associations configured successfully');

module.exports = db;
