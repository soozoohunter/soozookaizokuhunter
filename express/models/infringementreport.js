// express/models/infringementreport.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InfringementReport extends Model {
    static associate(models) {
      InfringementReport.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      InfringementReport.belongsTo(models.Scan, { foreignKey: 'scan_id', as: 'scan' });
      InfringementReport.hasMany(models.DMCARequest, { foreignKey: 'report_id', as: 'dmcaRequests' });
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
    links_confirmed: DataTypes.JSONB, // 使用 JSONB 儲存連結陣列
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'InfringementReport',
    tableName: 'infringement_reports',
    underscored: true,
  });
  return InfringementReport;
};
