'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Scan.belongsTo(models.File, {
        foreignKey: 'file_id',
        as: 'file'
      });
    }
  }
  Scan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    result: {
      type: DataTypes.JSONB
    },
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Scan',
  });
  return Scan;
};
