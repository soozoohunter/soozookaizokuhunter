'use strict';
module.exports = {
  async up (queryInterface) {
    await queryInterface.bulkInsert('SubscriptionPlans', [
      { plan_code: 'basic', name: 'BASIC', monthly_price: 10, image_upload_limit: 30, scan_limit_monthly: 50, dmca_takedown_limit_monthly: 3, scan_frequency_in_hours: 24, has_legal_consultation: false, createdAt: new Date(), updatedAt: new Date() },
      { plan_code: 'pro', name: 'PRO', monthly_price: 30, image_upload_limit: null, scan_limit_monthly: null, dmca_takedown_limit_monthly: 10, scan_frequency_in_hours: 24, has_legal_consultation: true, createdAt: new Date(), updatedAt: new Date() },
      { plan_code: 'enterprise', name: 'ENTERPRISE', monthly_price: 100, image_upload_limit: null, scan_limit_monthly: null, dmca_takedown_limit_monthly: null, scan_frequency_in_hours: 24, has_legal_consultation: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down (queryInterface) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
