// express/models/User.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'basic'
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
    },

    // 新增可綁定之社群帳號欄位 (IG / FB / Tiktok)
    igAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true  // 若您想限制唯一，則保留
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
