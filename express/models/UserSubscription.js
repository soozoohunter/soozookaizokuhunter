'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSubscription extends Model {
    static associate(models) {
      // 一筆訂閱紀錄屬於一個使用者
      UserSubscription.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      // 一筆訂閱紀錄對應一個計劃
      UserSubscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'plan_id',
        as: 'plan',
      });
    }
  }
  UserSubscription.init({
    user_id: DataTypes.INTEGER,
    plan_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    started_at: DataTypes.DATE,
    expires_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'UserSubscriptions',
  });
  return UserSubscription;
};
