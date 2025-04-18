'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    // 針對檔案基本資訊
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
    // 關聯到 user
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // DB 裡的 users 表
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  // 定義關聯
  File.associate = models => {
    File.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' });
  };

  return File;
};
