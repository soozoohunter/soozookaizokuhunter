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
        model: 'Users', // 確保這裡指向 Users 表
        key: 'id'
      }
    },
    feature_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Sequelize 會自動處理 createdAt 和 updatedAt
  }, {
    sequelize,
    modelName: 'UsageRecord',
    tableName: 'UsageRecords',
    underscored: true, // 使用底線命名法 (user_id, feature_code)
  });
  return UsageRecord;
};
