'use strict';
module.exports = {
  async up (queryInterface) {
    await queryInterface.bulkInsert('SubscriptionPlans', [
      { plan_code: 'basic', name: 'BASIC', monthly_price: 10, annual_price: 100, video_limit: 10, works_quota: 30, image_upload_limit: 30, scan_quota_monthly: 50, dmca_free: 3, dmca_quota_monthly: 3, scan_frequency_in_hours: 24, scan_frequency: 'daily', has_legal_consultation: false, createdAt: new Date(), updatedAt: new Date() },
      { plan_code: 'pro', name: 'PRO', monthly_price: 30, annual_price: 300, video_limit: null, works_quota: null, image_upload_limit: null, scan_quota_monthly: null, dmca_free: 10, dmca_quota_monthly: 10, scan_frequency_in_hours: 24, scan_frequency: 'daily', has_legal_consultation: true, createdAt: new Date(), updatedAt: new Date() },
      { plan_code: 'enterprise', name: 'ENTERPRISE', monthly_price: 100, annual_price: 1000, video_limit: null, works_quota: null, image_upload_limit: null, scan_quota_monthly: null, dmca_free: null, dmca_quota_monthly: null, scan_frequency_in_hours: 24, scan_frequency: 'realtime', has_legal_consultation: true, createdAt: new Date(), updatedAt: new Date() },
      { plan_code: 'pay_per_feature', name: 'PAY_PER_FEATURE', monthly_price: 0, annual_price: 0, video_limit: null, works_quota: null, image_upload_limit: null, scan_quota_monthly: null, dmca_free: 0, dmca_quota_monthly: 0, scan_frequency_in_hours: 24, scan_frequency: '24h', has_legal_consultation: false, createdAt: new Date(), updatedAt: new Date() }
    ], {
      // Skip inserting a record if a plan with the same `plan_code`
      // already exists. The container runs seeders on every start,
      // so we need idempotent inserts.
      ignoreDuplicates: true
    });
  },
  async down (queryInterface) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
