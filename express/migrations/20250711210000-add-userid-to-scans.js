'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable('Scans');
      if (!columns.user_id) {
        console.log('Adding "user_id" column to "Scans" table...');
        await queryInterface.addColumn('Scans', 'user_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          after: 'file_id'
        }, { transaction });
        console.log('Column "user_id" has been successfully added.');
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable('Scans');
      if (columns.user_id) {
        console.log('Removing "user_id" column from "Scans" table...');
        await queryInterface.removeColumn('Scans', 'user_id', { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
