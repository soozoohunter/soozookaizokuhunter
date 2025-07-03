'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'plan', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'free_trial',
    });
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'active',
    });
    await queryInterface.addColumn('users', 'image_upload_limit', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });
    await queryInterface.addColumn('users', 'scan_limit_monthly', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 20,
    });
    await queryInterface.addColumn('users', 'image_upload_usage', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('users', 'scan_usage_monthly', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('users', 'scan_usage_reset_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'scan_usage_reset_at');
    await queryInterface.removeColumn('users', 'scan_usage_monthly');
    await queryInterface.removeColumn('users', 'image_upload_usage');
    await queryInterface.removeColumn('users', 'scan_limit_monthly');
    await queryInterface.removeColumn('users', 'image_upload_limit');
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'plan');
  }
};
