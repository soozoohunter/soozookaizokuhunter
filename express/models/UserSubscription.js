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
    user_id: DataTypes.INTEGER,
    plan_id: DataTypes.INTEGER,
    status: { type: DataTypes.ENUM('active','expired','cancelled'), defaultValue: 'active' },
    started_at: DataTypes.DATE,
    expires_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'UserSubscriptions'
  });
  return UserSubscription;
};
