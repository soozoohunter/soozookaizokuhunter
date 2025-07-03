'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubscriptionPlans', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      plan_code: { type: Sequelize.STRING, unique: true },
      name: Sequelize.STRING,
      monthly_price: Sequelize.INTEGER,
      image_upload_limit: { type: Sequelize.INTEGER, allowNull: true },
      scan_limit_monthly: { type: Sequelize.INTEGER, allowNull: true },
      dmca_takedown_limit_monthly: { type: Sequelize.INTEGER, allowNull: true },
      scan_frequency_in_hours: Sequelize.INTEGER,
      has_legal_consultation: Sequelize.BOOLEAN,
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('SubscriptionPlans');
  }
};
