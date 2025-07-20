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
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fingerprint: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    ipfs_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    mime_type: DataTypes.STRING,
    size: DataTypes.INTEGER,
    thumbnail_path: DataTypes.STRING,
    certificate_path: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return File;
};
