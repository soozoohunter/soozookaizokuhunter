'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_actions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      session_id: { type: Sequelize.STRING },
      path: { type: Sequelize.STRING },
      method: { type: Sequelize.STRING },
      status_code: { type: Sequelize.INTEGER },
      duration: { type: Sequelize.INTEGER },
      user_agent: { type: Sequelize.STRING },
      ip: { type: Sequelize.STRING },
      referrer: { type: Sequelize.STRING },
      conversion_type: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_actions');
  }
};
