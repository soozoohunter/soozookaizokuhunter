'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure correct foreign key reference
    await queryInterface.changeColumn('UsageRecords', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }).catch(() => {});

    // Correct feature_code enum type
    await queryInterface.changeColumn('UsageRecords', 'feature_code', {
      type: Sequelize.ENUM('image_upload', 'scan', 'dmca_takedown'),
      allowNull: false
    }).catch(() => {});

    // Ensure default timestamp for created_at
    await queryInterface.changeColumn('UsageRecords', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }).catch(() => {});

    // Remove updated_at column if exists
    await queryInterface.removeColumn('UsageRecords', 'updated_at').catch(() => {});

    // Add optional fields if missing
    await queryInterface.addColumn('UsageRecords', 'usage_count', { type: Sequelize.INTEGER, defaultValue: 1 }).catch(() => {});
    await queryInterface.addColumn('UsageRecords', 'period_start', { type: Sequelize.DATE, allowNull: true }).catch(() => {});
    await queryInterface.addColumn('UsageRecords', 'period_end', { type: Sequelize.DATE, allowNull: true }).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('UsageRecords', 'user_id', { type: Sequelize.INTEGER }).catch(() => {});
    await queryInterface.changeColumn('UsageRecords', 'feature_code', { type: Sequelize.STRING }).catch(() => {});
    await queryInterface.changeColumn('UsageRecords', 'created_at', { type: Sequelize.DATE }).catch(() => {});
    await queryInterface.addColumn('UsageRecords', 'updated_at', { type: Sequelize.DATE }).catch(() => {});
    await queryInterface.removeColumn('UsageRecords', 'usage_count').catch(() => {});
    await queryInterface.removeColumn('UsageRecords', 'period_start').catch(() => {});
    await queryInterface.removeColumn('UsageRecords', 'period_end').catch(() => {});
  }
};
