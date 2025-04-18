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
      type: DataTypes.STRING(64),
      allowNull: true
    },
    ipfs_hash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cloud_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dmca_flag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Files',
    timestamps: false
  });

  File.associate = models => {
    File.belongsTo(models.User, {
      as: 'owner',
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return File;
};
