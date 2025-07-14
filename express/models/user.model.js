'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.File, { foreignKey: 'user_id' });
      User.hasMany(models.Scan, { foreignKey: 'user_id' });
      User.hasMany(models.UsageRecord, { foreignKey: 'user_id' });
      User.hasMany(models.UserSubscription, { foreignKey: 'user_id' });
    }
  }
  User.init({
    // ... (欄位定義保持不變)
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    real_name: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false, unique: true, validate: { is: { args: /^09\d{8}$/, msg: '電話號碼格式不正確' } } },
    role: { type: DataTypes.ENUM('admin', 'user', 'trial'), defaultValue: 'user' },
    status: { type: DataTypes.ENUM('active', 'suspended', 'deleted'), defaultValue: 'active' },
    last_login: DataTypes.DATE,
    quota: { type: DataTypes.INTEGER, defaultValue: 10 }
  }, {
    sequelize,
    modelName: 'User',
    // [修正] 將資料表名稱改為小寫 snake_case
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] }
    ]
  });

  return User;
};
