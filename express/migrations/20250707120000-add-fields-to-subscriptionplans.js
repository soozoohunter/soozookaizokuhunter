'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SubscriptionPlans', 'annual_price', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('SubscriptionPlans', 'video_limit', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('SubscriptionPlans', 'image_limit', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('SubscriptionPlans', 'scan_frequency', { type: Sequelize.STRING(16), allowNull: true });
    await queryInterface.addColumn('SubscriptionPlans', 'dmca_free', { type: Sequelize.INTEGER, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SubscriptionPlans', 'annual_price');
    await queryInterface.removeColumn('SubscriptionPlans', 'video_limit');
    await queryInterface.removeColumn('SubscriptionPlans', 'image_limit');
    await queryInterface.removeColumn('SubscriptionPlans', 'scan_frequency');
    await queryInterface.removeColumn('SubscriptionPlans', 'dmca_free');
  }
};
