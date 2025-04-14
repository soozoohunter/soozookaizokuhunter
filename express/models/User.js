// express/models/User.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // Email
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // 加密後密碼
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 用戶名稱
    userName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 角色: e.g. 'copyright' / 'trademark' / 'both'...
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'copyright'
    },
    // 方案: BASIC / ADVANCED / PRO / ENTERPRISE
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'BASIC'
    },

    // 上傳次數
    uploadVideos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    uploadImages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    // 選填: igAccount, facebookAccount, tiktokAccount
    igAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    facebookAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    tiktokAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  });

  return User;
};
