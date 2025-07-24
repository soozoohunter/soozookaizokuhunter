'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ContactSubmission extends Model {
    static associate(models) {
      ContactSubmission.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  ContactSubmission.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('new', 'read', 'archived'), defaultValue: 'new' },
    user_id: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'ContactSubmission',
    tableName: 'contact_submissions',
    underscored: true,
  });
  return ContactSubmission;
};
