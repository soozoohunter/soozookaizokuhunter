'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fingerprint: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    ipfs_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // 可用於AI偵測結果
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    infringingLinks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resultJson: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'files',
    timestamps: true
  });

  return File;
};
