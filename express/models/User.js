'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.File, { foreignKey: 'user_id', as: 'files' });
    }
  }
  User.init({
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    // ... 其他欄位
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'User', // [核心修正] 表名固定為單數 User
  });
  return User;
};
