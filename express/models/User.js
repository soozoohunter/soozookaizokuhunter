/********************************************************************
 * models/User.js
 * Sequelize 定義 user 表，包含 email (必填), userName(登入用), password,
 * 以及社群/電商欄位 (可選, unique)，serialNumber(唯一序號) 等。
 ********************************************************************/
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // email (必填，但不做登入用)
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true   // 電子郵件必須唯一
    },

    // userName (必填, 唯一, 用於登入)
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true   // 使用者名稱必須唯一
    },

    // bcrypt 雜湊後的密碼
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // 社群/電商平台帳號欄位 (允許 null，但若填寫則必須唯一)
    ig: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    fb: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    tiktok: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    shopee: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    ruten: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    ebay: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    amazon: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    taobao: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    // 使用者序號 (必填, 唯一). 可自行定義生成規則
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    // 可再添加 plan, role 等欄位
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'BASIC'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'copyright'
    }

  }, {
    // 若想自動紀錄 createdAt / updatedAt 可改 timestamps: true
    timestamps: true
  });

  return User;
};
