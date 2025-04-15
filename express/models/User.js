'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // 電子郵件
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true  // 驗證格式為 Email
      }
    },
    // 用戶名
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // 加密後的密碼雜湊
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 角色（預設'user'，如需其他角色可在此擴充）
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    // 序號（允許為空）
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    // 社群/電商帳號綁定資訊（允許為空）
    socialBinding: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 會員方案(plan)欄位，如不需要可刪除
    plan: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'BASIC'
    }
  }, {
    // 模型選項
    hooks: {
      // 在建立使用者前自動執行密碼加密
      beforeCreate: async (user, options) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // 如果有更新密碼，也可以在beforeUpdate中處理類似邏輯:
      // beforeUpdate: async (user, options) => { ... }
    },
    // 如果使用下劃線命名，可以加上 underscored: true，看專案需要
  });

  // 可定義模型關聯 (associations) 這裡略過，如: User.associate = models => { ... };

  return User;
};
