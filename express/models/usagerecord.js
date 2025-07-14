'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UsageRecord extends Model {
    static associate(models) {
      UsageRecord.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UsageRecord.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    feature_code: {
      type: DataTypes.ENUM('image_upload', 'scan', 'dmca_takedown'),
      allowNull: false
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    period_start: DataTypes.DATE,
    period_end: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UsageRecord',
    tableName: 'usage_records',
    underscored: true,
    timestamps: false
  });
  return UsageRecord;
};
