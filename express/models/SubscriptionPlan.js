const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    static associate(models) {
      SubscriptionPlan.hasMany(models.UserSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
    }
  }
  SubscriptionPlan.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_code: { type: DataTypes.STRING, unique: true },
    name: DataTypes.STRING,
    monthly_price: DataTypes.INTEGER,
    image_upload_limit: { type: DataTypes.INTEGER, allowNull: true },
    scan_limit_monthly: { type: DataTypes.INTEGER, allowNull: true },
    dmca_takedown_limit_monthly: { type: DataTypes.INTEGER, allowNull: true },
    scan_frequency_in_hours: DataTypes.INTEGER,
    has_legal_consultation: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'SubscriptionPlans'
  });
  return SubscriptionPlan;
};
