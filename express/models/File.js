'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      File.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      File.hasMany(models.Scan, { foreignKey: 'file_id', as: 'scans' });
    }
  }
  File.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'User', key: 'id' } },
    fingerprint: { type: DataTypes.STRING, unique: true },
    // ... 其他欄位
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'File',
  });
  return File;
};
