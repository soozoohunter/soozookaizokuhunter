'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
    uploadImages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uploadVideos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialBinding: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    timestamps: true // createdAt, updatedAt
  });

  // 若有 hooks: { beforeCreate: ... }，可加
  return User;
};
