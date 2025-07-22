'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAction extends Model {
    static associate(models) {
      UserAction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UserAction.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    session_id: DataTypes.STRING,
    path: DataTypes.STRING,
    method: DataTypes.STRING,
    status_code: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    user_agent: DataTypes.STRING,
    ip: DataTypes.STRING,
    referrer: DataTypes.STRING,
    conversion_type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserAction',
    tableName: 'user_actions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return UserAction;
};
