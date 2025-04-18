'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    // ★ 將原先的 filename 與 snippet 的 fileName 統一為 fileName
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // ★ 新增 filePath 欄位
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // ★ 從原先 snippet 保留
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

    // ★ 關聯到 user_id
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',  // 注意：這裡參考的是資料庫內的 "Users" 表
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  // 關聯設定
  File.associate = models => {
    File.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' });
  };

  return File;
};
