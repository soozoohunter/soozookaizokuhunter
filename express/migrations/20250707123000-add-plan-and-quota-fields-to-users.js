'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    const addIfNotExists = async (columnName, options) => {
      if (!table[columnName]) {
        await queryInterface.addColumn('users', columnName, options);
      }
    };

    await Promise.all([
      addIfNotExists('status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      }),
      addIfNotExists('image_upload_limit', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5
      }),
      addIfNotExists('scan_limit_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      }),
      addIfNotExists('dmca_takedown_limit_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      addIfNotExists('scan_usage_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      addIfNotExists('scan_usage_reset_at', {
        type: Sequelize.DATE,
        allowNull: true
      })
    ]);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    const removeIfExists = async (columnName) => {
      if (table[columnName]) {
        await queryInterface.removeColumn('users', columnName);
      }
    };

    await Promise.all([
      removeIfExists('status'),
      removeIfExists('image_upload_limit'),
      removeIfExists('scan_limit_monthly'),
      removeIfExists('dmca_takedown_limit_monthly'),
      removeIfExists('scan_usage_monthly'),
      removeIfExists('scan_usage_reset_at')
    ]);
  }
};
