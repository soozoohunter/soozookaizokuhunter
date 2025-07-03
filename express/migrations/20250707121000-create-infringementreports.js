'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InfringementReports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      scan_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Scans', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      links_confirmed: Sequelize.JSONB,
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('InfringementReports');
  }
};
