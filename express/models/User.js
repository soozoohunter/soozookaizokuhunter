/********************************************************************
 * models/User.js
 ********************************************************************/
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    // email 改為 unique
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // bcryptjs 後的哈希
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userName: {
      field: 'user_name',
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'copyright'
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'BASIC'
    },
    uploadVideos: {
      field: 'upload_videos',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    uploadImages: {
      field: 'upload_images',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'users',
    timestamps: false
  });
};
