'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const plans = [
      {
        plan_code: 'free_trial',
        name: 'Free Trial',
        monthly_price: 0,
        image_limit: 5, // 總共 5 張
        scan_limit_monthly: 10,
        dmca_takedown_limit_monthly: 0,
        scan_frequency_in_hours: 48, // 每 48 小時
        has_legal_consultation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'basic',
        name: 'BASIC',
        monthly_price: 490,
        image_limit: 5, // 總共 5 張
        video_limit: 3, // 總共 3 支
        scan_limit_monthly: 30, // 假設每天掃描一次
        dmca_takedown_limit_monthly: 1,
        scan_frequency_in_hours: 24, // 24h infringement detection
        has_legal_consultation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'pro',
        name: 'PRO',
        monthly_price: 1290,
        image_limit: 30,
        video_limit: 10,
        scan_limit_monthly: 30, // Priority AI scanning (daily)
        dmca_takedown_limit_monthly: 3,
        scan_frequency_in_hours: 24, // daily
        has_legal_consultation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        plan_code: 'enterprise',
        name: 'ENTERPRISE',
        monthly_price: 3990,
        image_limit: null, // null 代表無限
        video_limit: null, // null 代表無限
        scan_limit_monthly: null, // Real-time AI scanning
        dmca_takedown_limit_monthly: null, // 無限制
        scan_frequency_in_hours: 1, // 近即時
        has_legal_consultation: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 使用 bulkInsert 寫入資料，並設定如果 plan_code 已存在則忽略，避免重複寫入
    await queryInterface.bulkInsert('SubscriptionPlans', plans, {
      ignoreDuplicates: true, // 關鍵設定：如果主鍵或唯一鍵衝突，則不執行插入
      updateOnDuplicate: ['name'] // Or pick a field that can be updated if needed
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
