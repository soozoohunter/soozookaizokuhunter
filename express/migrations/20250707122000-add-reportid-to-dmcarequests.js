'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 檢查 DMCARequests 表格中是否已存在 report_id 欄位
      const columns = await queryInterface.describeTable('DMCARequests');
      if (!columns.report_id) {
        await queryInterface.addColumn(
          'DMCARequests',
          'report_id', {
            type: Sequelize.INTEGER, // 確保資料類型與 InfringementReports 的主鍵類型一致
            allowNull: true, // 根據您的業務邏輯決定是否允許為空
            references: {
              model: 'InfringementReports', // 引用 InfringementReports 表
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // 或 'CASCADE'，根據您的業務邏輯設定
          }, {
            transaction
          }
        );
        console.log('Added report_id to DMCARequests table.');
      } else {
        console.log('Column "report_id" already exists in DMCARequests, skipping add.');
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Error in migration 20250707122000-add-reportid-to-dmcarequests (up):', err);
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 檢查 DMCARequests 表格中是否已存在 report_id 欄位才移除
      const columns = await queryInterface.describeTable('DMCARequests');
      if (columns.report_id) {
        await queryInterface.removeColumn(
          'DMCARequests',
          'report_id', {
            transaction
          }
        );
        console.log('Removed report_id from DMCARequests table.');
      } else {
        console.log('Column "report_id" does not exist in DMCARequests, skipping remove.');
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Error in migration 20250707122000-add-reportid-to-dmcarequests (down):', err);
      throw err;
    }
  }
};
