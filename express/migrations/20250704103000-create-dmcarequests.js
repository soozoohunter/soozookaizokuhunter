'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DMCARequests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      scan_id: { type: Sequelize.INTEGER, references: { model: 'Scans', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      infringing_url: Sequelize.STRING,
      status: { type: Sequelize.ENUM('pending','submitted','completed','failed') },
      dmca_case_id: Sequelize.STRING,
      submitted_at: Sequelize.DATE,
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('DMCARequests');
  }
};
