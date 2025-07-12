'use strict';
module.exports = (sequelize, DataTypes) => {
  const ManualReport = sequelize.define('ManualReport', {
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    infringing_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_phone: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    response: DataTypes.TEXT
  }, {
    tableName: 'manual_reports'
  });

  return ManualReport;
};
