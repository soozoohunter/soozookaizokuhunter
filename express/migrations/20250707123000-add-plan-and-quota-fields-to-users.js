'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 使用 Promise.all 來並行新增所有欄位
    await Promise.all([
      queryInterface.addColumn('users', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      }),
      queryInterface.addColumn('users', 'image_upload_limit', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5
      }),
      queryInterface.addColumn('users', 'scan_limit_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      }),
      queryInterface.addColumn('users', 'dmca_takedown_limit_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      queryInterface.addColumn('users', 'scan_usage_monthly', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      queryInterface.addColumn('users', 'scan_usage_reset_at', {
        type: Sequelize.DATE,
        allowNull: true
      })
    ]);
  },

  async down (queryInterface, Sequelize) {
    // 定義 "down" 操作，以便未來可以復原這些變更
    await Promise.all([
      queryInterface.removeColumn('users', 'status'),
      queryInterface.removeColumn('users', 'image_upload_limit'),
      queryInterface.removeColumn('users', 'scan_limit_monthly'),
      queryInterface.removeColumn('users', 'dmca_takedown_limit_monthly'),
      queryInterface.removeColumn('users', 'scan_usage_monthly'),
      queryInterface.removeColumn('users', 'scan_usage_reset_at')
    ]);
  }
};
