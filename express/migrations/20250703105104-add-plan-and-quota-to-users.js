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

    await addIfNotExists('plan', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'free_trial',
    });

    await addIfNotExists('status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'active',
    });

    await addIfNotExists('image_upload_limit', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });

    await addIfNotExists('scan_limit_monthly', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 20,
    });

    await addIfNotExists('image_upload_usage', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await addIfNotExists('scan_usage_monthly', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await addIfNotExists('scan_usage_reset_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    const removeIfExists = async (columnName) => {
      if (table[columnName]) {
        await queryInterface.removeColumn('users', columnName);
      }
    };

    await removeIfExists('scan_usage_reset_at');
    await removeIfExists('scan_usage_monthly');
    await removeIfExists('image_upload_usage');
    await removeIfExists('scan_limit_monthly');
    await removeIfExists('image_upload_limit');
    await removeIfExists('status');
    await removeIfExists('plan');
  }
};
