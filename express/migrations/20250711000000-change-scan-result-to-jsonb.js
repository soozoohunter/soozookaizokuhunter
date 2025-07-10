'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 將 Scans 表中的 result 欄位類型從 TEXT 改為 JSONB
    await queryInterface.changeColumn('Scans', 'result', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // 降級操作：將其改回 TEXT 類型
    await queryInterface.changeColumn('Scans', 'result', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
};
