'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.UserSubscription, {
        foreignKey: 'plan_id',
        as: 'UserSubscriptions',
      });
    }
  }
  SubscriptionPlan.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_code: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    monthly_price: DataTypes.DECIMAL(10, 2),
    annual_price: DataTypes.DECIMAL(10, 2),
    works_quota: { type: DataTypes.INTEGER },
    scan_quota_monthly: { type: DataTypes.INTEGER },
    dmca_quota_monthly: { type: DataTypes.INTEGER },
    scan_frequency: { type: DataTypes.STRING }, // 'manual', 'weekly', 'daily'
    has_batch_processing: { type: DataTypes.BOOLEAN, defaultValue: false },
    has_trademark_monitoring: { type: DataTypes.BOOLEAN, defaultValue: false },
    has_p2p_engine: { type: DataTypes.BOOLEAN, defaultValue: false },
    has_legal_consultation: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
  });
  return SubscriptionPlan;
};
