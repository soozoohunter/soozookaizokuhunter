const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastFive: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    planWanted: {
      type: DataTypes.ENUM('BASIC','PRO','ENTERPRISE'),
      allowNull: false,
      defaultValue: 'PRO'
    },
    status: {
      type: DataTypes.ENUM('PENDING','APPROVED','REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING'
    }
  }, {
    tableName: 'Payments',
    timestamps: true
  });
  return Payment;
};
