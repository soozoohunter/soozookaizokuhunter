'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // ★★★ 關鍵修正：為所有關聯加上別名(as)，並補上缺少的關聯 ★★★
      User.hasMany(models.File, { foreignKey: 'user_id', as: 'Files' });
      User.hasMany(models.Scan, { foreignKey: 'user_id', as: 'Scans' });
      User.hasMany(models.UsageRecord, { foreignKey: 'user_id', as: 'UsageRecords' });
      User.hasMany(models.UserSubscription, { foreignKey: 'user_id', as: 'UserSubscriptions' });
      User.hasMany(models.PaymentProof, { foreignKey: 'user_id', as: 'PaymentProofs' });
      User.hasMany(models.InfringementCase, { foreignKey: 'user_id', as: 'InfringementCases' });
      User.hasMany(models.ContactSubmission, { foreignKey: 'user_id', as: 'ContactSubmissions' });
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    real_name: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false, unique: true, validate: { is: { args: /^09\d{8}$/, msg: '電話號碼格式不正確' } } },
    role: { type: DataTypes.ENUM('admin', 'member', 'trial', 'elite'), defaultValue: 'trial' }, // 新增 elite 等級
    status: { type: DataTypes.ENUM('active', 'suspended', 'deleted'), defaultValue: 'active' },
    last_login: DataTypes.DATE,
    quota: { type: DataTypes.INTEGER, defaultValue: 10 }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] }
    ]
  });

  return User;
};
