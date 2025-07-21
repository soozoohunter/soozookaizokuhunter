// backend/src/models/file.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // A file belongs to a user
      File.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // A file can have many scans
      File.hasMany(models.Scan, { foreignKey: 'file_id', as: 'scans' });
    }
  }
  
  File.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // table name should be lowercase
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fingerprint: {
      type: DataTypes.STRING(64), // SHA256 is 64 hex characters
      allowNull: false,
      unique: true
    },
    ipfs_hash: {
      type: DataTypes.STRING,
      allowNull: true // Allow null in case IPFS fails
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true // Allow null in case blockchain fails
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.BIGINT, // Use BIGINT for file size
      allowNull: true
    },
    thumbnail_path: {
      type: DataTypes.STRING,
      allowNull: true
    },
    certificate_path: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
    underscored: true, // This automatically converts camelCase field names to snake_case in the DB
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return File;
};
