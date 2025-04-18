'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
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
      allowNull: false,
      defaultValue: 'user'
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'free'
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
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    // timestamps: false,
    hooks: {
      async beforeCreate(user) {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // User.associate = (models) => { ... }

  return User;
};
