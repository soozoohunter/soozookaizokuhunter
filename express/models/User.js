'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
    email: { type:DataTypes.STRING, allowNull:false, unique:true },
    userName: { type:DataTypes.STRING, allowNull:false, unique:true },
    password: { type:DataTypes.STRING, allowNull:false },
    role: { type:DataTypes.STRING, defaultValue:'user' },
    plan: { type:DataTypes.STRING, defaultValue:'free' },
    uploadImages: { type:DataTypes.INTEGER, defaultValue:0 },
    uploadVideos: { type:DataTypes.INTEGER, defaultValue:0 },
    serialNumber: { type:DataTypes.STRING },
    socialBinding: { type:DataTypes.STRING },
    isPaid: { type:DataTypes.BOOLEAN, defaultValue:false }
  }, {
    tableName:'users',
    timestamps:true
  });

  return User;
};
