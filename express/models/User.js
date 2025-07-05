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
    // ... 您的 User 欄位定義 ...
    username: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    phone: DataTypes.STRING,
    status: DataTypes.STRING,
    realName: DataTypes.STRING,
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
