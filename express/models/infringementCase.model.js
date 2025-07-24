'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  class InfringementCase extends Model {
    static associate(models) {
      InfringementCase.belongsTo(models.User, { foreignKey: 'user_id' });
      InfringementCase.belongsTo(models.File, { foreignKey: 'file_id' });
    }
  }
  InfringementCase.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    file_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'files', key: 'id' } },
    unique_case_id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
    infringing_url: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('detected', 'offer_sent', 'licensed', 'takedown_requested', 'closed'),
      defaultValue: 'detected'
    },
    resolution_status: {
      type: DataTypes.ENUM('pending', 'license_offered', 'license_purchased', 'dmca_sent', 'ignored'),
      defaultValue: 'pending'
    },
    license_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 999.00 },
    creator_share: DataTypes.DECIMAL(5,2),
    platform_share: DataTypes.DECIMAL(5,2),
    license_revenue: DataTypes.DECIMAL(10,2),
    notes: { type: DataTypes.TEXT }
  }, {
    sequelize,
    modelName: 'InfringementCase',
    tableName: 'infringement_cases',
    underscored: true
  });
  return InfringementCase;
};
