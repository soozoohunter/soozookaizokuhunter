'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
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
      type: DataTypes.STRING
    },
    tx_hash: {
      type: DataTypes.STRING
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'files',
    timestamps: true // createdAt, updatedAt
  });

  return File;
};
