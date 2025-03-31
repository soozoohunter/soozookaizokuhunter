const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: DataTypes.STRING,
    role: { type: DataTypes.ENUM('shortVideo','ecommerce'), defaultValue:'shortVideo' }
  }, { tableName:'users' });

  return User;
};
