'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER, 
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // bcrypt 雜湊後
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    plan: {
      type: DataTypes.STRING,
      defaultValue: 'free'
    },
    // 上傳次數
    uploadImages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uploadVideos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    serialNumber: {
      type: DataTypes.STRING
    },
    // JSON 欄位
    socialBinding: {
      type: DataTypes.STRING
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
