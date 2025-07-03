'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UsageRecords', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      feature_code: { type: Sequelize.ENUM('image_upload', 'scan', 'dmca_takedown') },
      usage_count: { type: Sequelize.INTEGER, defaultValue: 1 },
      period_start: Sequelize.DATE,
      period_end: Sequelize.DATE,
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('UsageRecords');
  }
};
