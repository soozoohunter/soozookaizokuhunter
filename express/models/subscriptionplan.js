// express/models/subscriptionplan.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.UserSubscription, {
        foreignKey: 'plan_id',
        as: 'UserSubscriptions', // 建議使用複數 as
      });
    }
  }
  SubscriptionPlan.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_code: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    monthly_price: DataTypes.DECIMAL(10, 2),
    annual_price: DataTypes.DECIMAL(10, 2),
    
    // 優化後，欄位名稱在程式碼和資料庫中保持一致
    works_quota: { type: DataTypes.INTEGER }, // "作品存證" 總額度
    scan_quota_monthly: { type: DataTypes.INTEGER }, // 每月 "AI 掃描" 額度
    dmca_quota_monthly: { type: DataTypes.INTEGER }, // 每月 "DMCA 下架" 額度

    scan_frequency_in_hours: DataTypes.INTEGER,
    has_legal_consultation: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
  });
  return SubscriptionPlan;
};
