/********************************************************************
 * models/File.js
 ********************************************************************/
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('File', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING
    },
    fingerprint: {
      type: DataTypes.STRING(64)
    },
    ipfs_hash: {
      type: DataTypes.TEXT
    },
    cloud_url: {
      type: DataTypes.TEXT
    },
    dmca_flag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tx_hash: {
      type: DataTypes.STRING(66)
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'files',
    timestamps: false
  });
};
