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
        isEmail: true // 驗證格式為 Email
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
    // 角色：預設 'user'，可為 'admin' 方便後台
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    // 會員方案 (plan)，預設 'free'
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'free'
    },
    // 序號 (optional)
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false // 若需唯一可改 true
    },
    // 社群/電商綁定資訊 (optional) - 用字串儲存
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
    hooks: {
      // 建立使用者前自動雜湊 (若你在 Router 已經手動雜湊，也可省略)
      beforeCreate: async (user, options) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // 若要在更新密碼時也加密，可在 beforeUpdate
      // beforeUpdate: async (user, options) => { ... }
    }
    // underscored: true, // 如果要使用下劃線
  });

  // 可定義關聯
  // User.associate = models => { ... };

  return User;
};
