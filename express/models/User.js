/************************************************************
 * models/User.js
 * - 調整：username、serialNumber 可為 null
 * - 保留 phone、birthDate、realName... 以便在 protect.js 建立用戶時帶入
 ************************************************************/
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,   // 可為 null
      unique: false
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true    // 可為 null
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },

    // 社群平台 (若您保留)
    IG: { type: DataTypes.STRING, allowNull: true },
    FB: { type: DataTypes.STRING, allowNull: true },
    YouTube: { type: DataTypes.STRING, allowNull: true },
    TikTok: { type: DataTypes.STRING, allowNull: true },
    Shopee: { type: DataTypes.STRING, allowNull: true },
    Ruten: { type: DataTypes.STRING, allowNull: true },
    Yahoo: { type: DataTypes.STRING, allowNull: true },
    Amazon: { type: DataTypes.STRING, allowNull: true },
    Taobao: { type: DataTypes.STRING, allowNull: true },
    eBay: { type: DataTypes.STRING, allowNull: true },

    // 其他欄位
    realName: { type: DataTypes.STRING, allowNull: true },
    birthDate: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'freeTrial'
    },
    uploadVideos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    uploadImages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
