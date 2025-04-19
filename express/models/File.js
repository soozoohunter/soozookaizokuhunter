'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
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
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',  // DB裡的 users 表
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  File.associate = (models) => {
    // 若 models.User 存在
    File.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' });
  };

  return File;
};
