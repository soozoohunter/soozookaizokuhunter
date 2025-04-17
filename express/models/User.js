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
    // 密碼（哈希儲存）
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 角色：預設 'user'，可為 'admin' 做後台管理
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    // 會員方案 (plan)，預設 'free' 或 'BASIC'
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'free'
    },
    // 序號（可選）
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false // 若您需唯一可改 true，但您原先寫unique: true也行
    },
    // 社群/電商綁定資訊（可選）
    socialBinding: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 是否已付款
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    // 模型選項
    hooks: {
      // 建立使用者前自動執行密碼加密
      beforeCreate: async (user, options) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // 若有更新密碼需求，可在 beforeUpdate 中 similarly 雜湊
      // beforeUpdate: async (user, options) => { ... }
    },
    // 如果要使用下劃線命名，可以加 underscored: true
    // underscored: true,
  });

  // 可定義模型關聯 (associations)
  // 例如： User.associate = (models) => { ... };

  return User;
};
