const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InfringementReport extends Model {
    static associate(models) {
      InfringementReport.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      InfringementReport.belongsTo(models.Scan, { foreignKey: 'scan_id', as: 'scan' });
    }
  }
  InfringementReport.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    scan_id: { type: DataTypes.INTEGER, allowNull: false },
    links_confirmed: DataTypes.JSONB,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'InfringementReport',
    tableName: 'InfringementReports',
    timestamps: false
  });
  return InfringementReport;
};
