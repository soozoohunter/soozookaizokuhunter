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
    // "works_quota" represents the total number of protected works allowed.
    works_quota: { type: DataTypes.INTEGER, field: 'image_limit' },
    // legacy field kept for compatibility but not used directly
    video_limit: DataTypes.INTEGER,
    image_upload_limit: DataTypes.INTEGER,
    // monthly scan credits
    scan_quota_monthly: { type: DataTypes.INTEGER, field: 'scan_limit_monthly' },
    dmca_free: DataTypes.INTEGER,
    // monthly DMCA takedown credits
    dmca_quota_monthly: { type: DataTypes.INTEGER, field: 'dmca_takedown_limit_monthly' },
    scan_frequency_in_hours: DataTypes.INTEGER,
    scan_frequency: DataTypes.STRING(16),
    has_legal_consultation: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
  });
  return SubscriptionPlan;
};
