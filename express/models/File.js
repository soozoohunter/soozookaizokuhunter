'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      File.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      File.hasMany(models.Scan, { foreignKey: 'file_id', as: 'scans' });
    }
  }
  File.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    filename: DataTypes.STRING,
    title: DataTypes.STRING,
    keywords: DataTypes.TEXT,
    mime_type: DataTypes.STRING,
    fingerprint: { type: DataTypes.STRING, unique: true },
    ipfs_hash: DataTypes.STRING,
    tx_hash: DataTypes.STRING,
    thumbnail_path: DataTypes.STRING,
    status: DataTypes.STRING,
    report_url: DataTypes.STRING,
    resultJson: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'Files',
    underscored: true,
  });
  return File;
};
