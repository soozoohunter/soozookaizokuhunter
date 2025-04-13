// Sequelize 定義 User 模型
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
    }
  });
  return User;
};
