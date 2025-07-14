'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSubscription extends Model {
    static associate(models) {
      UserSubscription.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      UserSubscription.belongsTo(models.SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
    }
  }
  UserSubscription.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    plan_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'SubscriptionPlans', key: 'id' } },
    status: DataTypes.STRING,
    started_at: DataTypes.DATE,
    expires_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'UserSubscriptions',
    underscored: true,
  });
  return UserSubscription;
};
