'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const plans = [
      {
        plan_code: 'FREE', name: '永久免費版', monthly_price: 0, annual_price: 0,
        works_quota: 5, scan_quota_monthly: 1, dmca_quota_monthly: 0,
        scan_frequency: 'manual', has_batch_processing: false, has_trademark_monitoring: false, has_p2p_engine: false, has_legal_consultation: false,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        plan_code: 'CREATOR', name: '守護者方案', monthly_price: 390, annual_price: 3900,
        works_quota: 100, scan_quota_monthly: 10, dmca_quota_monthly: 1,
        scan_frequency: 'weekly', has_batch_processing: false, has_trademark_monitoring: false, has_p2p_engine: true, has_legal_consultation: false,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        plan_code: 'CREATOR_PLUS', name: '進階守護者', monthly_price: 990, annual_price: 9900,
        works_quota: 300, scan_quota_monthly: 30, dmca_quota_monthly: 3,
        scan_frequency: 'weekly', has_batch_processing: false, has_trademark_monitoring: false, has_p2p_engine: true, has_legal_consultation: false,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        plan_code: 'PROFESSIONAL', name: '捍衛者方案', monthly_price: 1490, annual_price: 14900,
        works_quota: 500, scan_quota_monthly: 50, dmca_quota_monthly: 5,
        scan_frequency: 'daily', has_batch_processing: true, has_trademark_monitoring: true, has_p2p_engine: true, has_legal_consultation: true,
        createdAt: new Date(), updatedAt: new Date()
      }
    ];
    await queryInterface.bulkInsert('subscription_plans', plans, { ignoreDuplicates: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscription_plans', { plan_code: ['FREE', 'CREATOR', 'CREATOR_PLUS', 'PROFESSIONAL'] });
  }
};
