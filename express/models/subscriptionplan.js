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
    price_monthly: DataTypes.DECIMAL(10, 2),
    image_limit: DataTypes.INTEGER,
    scan_limit_monthly: DataTypes.INTEGER,
    dmca_takedown_limit_monthly: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
  });
  return SubscriptionPlan;
};
