const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DMCARequest extends Model {
    static associate(models) {
      DMCARequest.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      DMCARequest.belongsTo(models.Scan, { foreignKey: 'scan_id', as: 'scan' });
      DMCARequest.belongsTo(models.InfringementReport, { foreignKey: 'report_id', as: 'report' });
    }
  }
  DMCARequest.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    scan_id: DataTypes.INTEGER,
    report_id: DataTypes.INTEGER,
    infringing_url: DataTypes.STRING,
    status: DataTypes.ENUM('pending','submitted','completed','failed'),
    dmca_case_id: DataTypes.STRING,
    submitted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'DMCARequest',
    tableName: 'DMCARequests'
  });
  return DMCARequest;
};
