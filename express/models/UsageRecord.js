const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsageRecord extends Model {
    static associate(models) {
      UsageRecord.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UsageRecord.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    feature_code: DataTypes.ENUM('image_upload','scan','dmca_takedown'),
    usage_count: { type: DataTypes.INTEGER, defaultValue: 1 },
    period_start: DataTypes.DATE,
    period_end: DataTypes.DATE,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'UsageRecord',
    tableName: 'UsageRecords',
    timestamps: false
  });
  return UsageRecord;
};
