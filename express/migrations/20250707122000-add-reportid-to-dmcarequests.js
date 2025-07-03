'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DMCARequests', 'report_id', {
      type: Sequelize.INTEGER,
      references: { model: 'InfringementReports', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('DMCARequests', 'report_id');
  }
};
