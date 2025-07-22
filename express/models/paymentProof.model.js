'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentProof extends Model {
    static associate(models) {
      PaymentProof.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  PaymentProof.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    plan_code: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    account_last_five: { type: DataTypes.STRING, allowNull: false },
    user_email: { type: DataTypes.STRING, allowNull: false },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    approved_by: { type: DataTypes.INTEGER }
  }, {
    sequelize,
    modelName: 'PaymentProof',
    tableName: 'payment_proofs',
    underscored: true
  });
  return PaymentProof;
};
