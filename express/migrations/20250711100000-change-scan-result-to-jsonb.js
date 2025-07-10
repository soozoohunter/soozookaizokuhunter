'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('Changing "result" column in "Scans" table to JSONB type...');
    await queryInterface.changeColumn('Scans', 'result', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    console.log('Column "result" has been successfully changed to JSONB.');
  },

  async down (queryInterface, Sequelize) {
    console.log('Reverting "result" column in "Scans" table back to TEXT...');
    await queryInterface.changeColumn('Scans', 'result', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    console.log('Column "result" has been successfully reverted to TEXT.');
  }
};
