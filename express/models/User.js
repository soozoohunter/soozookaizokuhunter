module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password_hash: DataTypes.STRING,
    role: {
      type: DataTypes.STRING,
      defaultValue: 'shortVideo'
    }
  },{
    tableName: 'users'
  });
  return User;
};
