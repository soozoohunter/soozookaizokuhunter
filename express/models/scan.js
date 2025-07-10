// express/models/scan.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    static associate(models) {
      Scan.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
      Scan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  Scan.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Files', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE
    },
    completed_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Scan',
    tableName: 'Scans',
    underscored: true,
  });
  return Scan;
};
