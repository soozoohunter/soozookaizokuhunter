'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: '姓名長度應在2-100字元之間'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: {
          args: /^09\d{8}$/,
          msg: '電話號碼格式不正確'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'trial'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
      defaultValue: 'active'
    },
    last_login: DataTypes.DATE,
    quota: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    }
  }, {
    tableName: 'Users',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] }
    ]
  });

  User.associate = function(models) {
    User.hasMany(models.File, { foreignKey: 'user_id' });
    User.hasMany(models.Scan, { foreignKey: 'user_id' });
    User.hasMany(models.UsageRecord, { foreignKey: 'user_id' });
  };

  return User;
};
