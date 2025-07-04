'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      // 一個方案可以對應到多個使用者訂閱
      SubscriptionPlan.hasMany(models.UserSubscriptions, {
        foreignKey: 'plan_id',
        as: 'subscriptions'
      });
    }
  }
  SubscriptionPlan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    plan_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    monthly_price: DataTypes.INTEGER,
    image_upload_limit: DataTypes.INTEGER,
    scan_limit_monthly: DataTypes.INTEGER,
    dmca_takedown_limit_monthly: DataTypes.INTEGER,
    scan_frequency_in_hours: DataTypes.INTEGER,
    has_legal_consultation: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubscriptionPlans',
    tableName: 'SubscriptionPlans', // 確保與您遷移檔案中的表名一致
    timestamps: true,
  });
  return SubscriptionPlan;
};
