'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.UserSubscription, {
        foreignKey: 'plan_id',
        as: 'userSubscriptions',
      });
    }
  }
  SubscriptionPlan.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_code: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    monthly_price: DataTypes.DECIMAL(10, 2),
    annual_price: DataTypes.INTEGER,
    video_limit: DataTypes.INTEGER,
    image_limit: DataTypes.INTEGER,
    image_upload_limit: DataTypes.INTEGER,
    scan_limit_monthly: DataTypes.INTEGER,
    dmca_free: DataTypes.INTEGER,
    dmca_takedown_limit_monthly: DataTypes.INTEGER,
    scan_frequency_in_hours: DataTypes.INTEGER,
    scan_frequency: DataTypes.STRING(16),
    has_legal_consultation: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'SubscriptionPlans',
    underscored: true,
  });
  return SubscriptionPlan;
};
