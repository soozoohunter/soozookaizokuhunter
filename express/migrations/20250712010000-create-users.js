'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      phone: { type: Sequelize.STRING, unique: true, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      username: Sequelize.STRING,
      realName: Sequelize.STRING,
      birthDate: Sequelize.DATE,
      address: Sequelize.STRING,
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      status: { type: Sequelize.STRING, defaultValue: 'active' },
      image_upload_limit: Sequelize.INTEGER,
      scan_limit_monthly: Sequelize.INTEGER,
      dmca_takedown_limit_monthly: Sequelize.INTEGER,
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
