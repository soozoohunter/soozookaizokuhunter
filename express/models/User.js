 'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // 自動主鍵 id
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Email
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // 使用者名稱
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // bcrypt 雜湊後的密碼
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 角色
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    // 計畫 (free / BASIC / 其他)
    plan: {
      type: DataTypes.STRING,
      defaultValue: 'free'
    },
    // 如果有需要紀錄上傳次數
    uploadImages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uploadVideos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 序號 (如需)
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 社群 / 電商欄位 JSON
    socialBinding: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 是否付費
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    timestamps: true // createdAt, updatedAt
  });

  return User;
};
