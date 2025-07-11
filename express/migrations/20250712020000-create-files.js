'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Files', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      filename: Sequelize.STRING,
      title: Sequelize.STRING,
      keywords: Sequelize.TEXT,
      mime_type: Sequelize.STRING,
      fingerprint: { type: Sequelize.STRING, unique: true },
      ipfs_hash: Sequelize.STRING,
      tx_hash: Sequelize.STRING,
      thumbnail_path: { type: Sequelize.STRING, allowNull: true },
      status: Sequelize.STRING,
      report_url: Sequelize.STRING,
      resultJson: { type: Sequelize.JSONB, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Files');
  }
};
