'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('Adding "user_id" column to "Scans" table...');
    await queryInterface.addColumn('Scans', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      // 建立與 users 表的外部索引鍵關聯
      references: {
        model: 'users', // 表格名稱應與 User model 的 tableName 相同
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      // 將此欄位放在 file_id 之後，讓結構更清晰 (可選)
      after: 'file_id' 
    });
    console.log('Column "user_id" has been successfully added.');
  },

  async down (queryInterface, Sequelize) {
    console.log('Removing "user_id" column from "Scans" table...');
    await queryInterface.removeColumn('Scans', 'user_id');
  }
};
