// 假設已經初始化 Sequelize 並連線，在此定義 User 模型
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
      // 可加入 validate: { isEmail: true } 作為額外驗證
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tiktok: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shopee: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ruten: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amazon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    taobao: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
  return User;
};
