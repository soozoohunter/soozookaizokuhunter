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
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    feature_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'UsageRecord',
    tableName: 'UsageRecords',
    underscored: true,
  });
  return UsageRecord;
};
