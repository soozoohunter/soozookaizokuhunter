'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // 一個使用者可以有多筆訂閱紀錄 (例如歷史紀錄)
      User.hasMany(models.UserSubscription, {
        foreignKey: 'user_id',
        as: 'subscriptions',
      });
      // 一個使用者可以有多個上傳檔案
      User.hasMany(models.File, {
        foreignKey: 'user_id',
        as: 'files',
      });
    }
  }
  User.init({
    // 基礎欄位
    username: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    phone: { type: DataTypes.STRING, unique: true },
    realName: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    
    // 社交媒體欄位 (從您的遷移中推斷)
    IG: { type: DataTypes.STRING },
    FB: { type: DataTypes.STRING },
    YouTube: { type: DataTypes.STRING },
    TikTok: { type: DataTypes.STRING },
    
    // 額度欄位 (由 Admin 或 Plan 指派時更新)
    image_upload_limit: { type: DataTypes.INTEGER, defaultValue: 0 },
    scan_limit_monthly: { type: DataTypes.INTEGER, defaultValue: 0 },
    dmca_takedown_limit_monthly: { type: DataTypes.INTEGER, defaultValue: 0 },

    // 用量追蹤 (可選，但建議保留以提高查詢效能)
    image_upload_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
    scan_usage_monthly: { type: DataTypes.INTEGER, defaultValue: 0 },
    scan_usage_reset_at: { type: DataTypes.DATE },

  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};
