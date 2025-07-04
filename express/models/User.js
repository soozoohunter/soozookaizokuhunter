'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // 一個使用者可以有多個訂閱紀錄
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
    username: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    phone: DataTypes.STRING,
    realName: DataTypes.STRING,
    // ... 其他您原有的欄位 ...
    // [修正] 我們將額度相關欄位移到 SubscriptionPlans，這裡可以移除或保留作為手動覆蓋
    image_upload_limit: DataTypes.INTEGER,
    scan_limit_monthly: DataTypes.INTEGER,
    dmca_takedown_limit_monthly: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};
