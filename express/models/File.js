// express/models/File.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // 定義關聯
      File.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  File.init({
    // 主鍵
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // 表格名稱
        key: 'id'
      }
    },
    // 基本資訊
    filename: DataTypes.STRING,
    title: DataTypes.STRING,
    keywords: DataTypes.TEXT,
    mime_type: DataTypes.STRING,
    
    // 存證資訊
    fingerprint: {
      type: DataTypes.STRING,
      unique: true // 確保每個指紋都是唯一的
    },
    ipfs_hash: DataTypes.STRING,
    tx_hash: DataTypes.STRING,
    
    // 狀態與結果
    status: DataTypes.STRING,
    report_url: DataTypes.STRING,
    
    // 【關鍵修正】將資料類型從 TEXT 或 STRING 修改為 JSONB
    resultJson: {
      type: DataTypes.JSONB, // 使用 JSONB 類型來儲存複雜的掃描結果物件
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'File',
    tableName: 'Files', // 明確指定表格名稱
    timestamps: true // 自動管理 createdAt 和 updatedAt
  });

  return File;
};
