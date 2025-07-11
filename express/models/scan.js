// express/models/scan.js (v2.0 - 補全關聯)
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    static associate(models) {
      // 一個掃描 (Scan) 屬於一個檔案 (File)
      Scan.belongsTo(models.File, { 
        foreignKey: 'file_id', 
        as: 'file' 
      });

      // 一個掃描 (Scan) 屬於一個使用者 (User)
      Scan.belongsTo(models.User, { 
        foreignKey: 'user_id', 
        as: 'user' 
      });

      // [核心修正] 補上缺失的反向關聯
      // 一個掃描 (Scan) 可以有多個 DMCA 請求
      Scan.hasMany(models.DMCARequest, {
        foreignKey: 'scan_id',
        as: 'dmcaRequests'
      });

      // [核心修正] 補上缺失的反向關聯
      // 一個掃描 (Scan) 可以有多個侵權報告
      Scan.hasMany(models.InfringementReport, {
        foreignKey: 'scan_id',
        as: 'infringementReports'
      });
    }
  }
  Scan.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Files', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
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
    started_at: {
      type: DataTypes.DATE
    },
    completed_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Scan',
    tableName: 'Scans',
    underscored: true,
  });
  return Scan;
};
