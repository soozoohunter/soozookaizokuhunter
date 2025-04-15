// models/User.js (Sequelize 模型定義)
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true   // 電子郵件必須唯一
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true   // 使用者名稱必須唯一
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false             // 將存儲經過雜湊的密碼
    },
    // 社群/電商平台帳號欄位 (允許 null，但若填寫則必須唯一)
    ig: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // IG 帳號唯一綁定
    },
    fb: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // FB 帳號唯一綁定
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // YouTube 帳號唯一綁定
    },
    tiktok: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // TikTok 帳號唯一綁定
    },
    shopee: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // Shopee 帳號唯一綁定
    },
    ruten: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // 露天拍賣 (Ruten) 帳號唯一綁定
    },
    ebay: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // eBay 帳號唯一綁定
    },
    amazon: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // Amazon 帳號唯一綁定
    },
    taobao: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true                // 淘寶 (Taobao) 帳號唯一綁定
    },
    serialNumber: {
      type: DataTypes.STRING,     // 序號格式 "YYYYMMNN"
      allowNull: false,
      unique: true                // 每個用戶有唯一序號
    }
  }, {
    timestamps: true  // 使用 createdAt 紀錄註冊時間
  });
  return User;
};
