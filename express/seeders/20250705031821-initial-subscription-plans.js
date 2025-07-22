'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const plans = [
      {
        plan_code: 'free_trial',
        name: 'Free Trial',
        monthly_price: 0,
        works_quota: 5, // 總共 5 件
        scan_quota_monthly: 10,
        dmca_quota_monthly: 0,
        scan_frequency_in_hours: 48, // 每 48 小時
        has_legal_consultation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'basic',
        name: 'BASIC',
        monthly_price: 490,
        works_quota: 5, // 總共 5 件
        video_limit: 3, // 總共 3 支
        scan_quota_monthly: 30, // 假設每天掃描一次
        dmca_quota_monthly: 1,
        scan_frequency_in_hours: 24, // 24h infringement detection
        has_legal_consultation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'pro',
        name: 'PRO',
        monthly_price: 1290,
        works_quota: 30,
        video_limit: 10,
        scan_quota_monthly: 30, // Priority AI scanning (daily)
        dmca_quota_monthly: 3,
        scan_frequency_in_hours: 24, // daily
        has_legal_consultation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'enterprise',
        name: 'ENTERPRISE',
        monthly_price: 3990,
        works_quota: null, // null 代表無限
        video_limit: null, // null 代表無限
        scan_quota_monthly: null, // Real-time AI scanning
        dmca_quota_monthly: null, // 無限制
        scan_frequency_in_hours: 1, // 近即時
        has_legal_consultation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 使用 bulkInsert 寫入資料，並設定如果 plan_code 已存在則忽略，避免重複寫入
    // PostgreSQL in Sequelize 6.x does not fully support the
    // `updateOnDuplicate` option for bulkInsert. Using it results in
    // runtime errors such as "Cannot read properties of undefined".
    // Instead, rely on `ignoreDuplicates` to skip records that already
    // exist based on the unique `plan_code` constraint.
    await queryInterface.bulkInsert('SubscriptionPlans', plans, {
      ignoreDuplicates: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
