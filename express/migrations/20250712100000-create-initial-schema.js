'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('===== Starting to build the entire database schema... =====');

    // 1. Create Users table
    console.log('Creating "Users" table...');
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      phone: { type: Sequelize.STRING, unique: true, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      username: Sequelize.STRING,
      realName: Sequelize.STRING,
      birthDate: Sequelize.DATE,
      address: Sequelize.STRING,
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      status: { type: Sequelize.STRING, defaultValue: 'active' },
      image_upload_limit: Sequelize.INTEGER,
      scan_limit_monthly: Sequelize.INTEGER,
      dmca_takedown_limit_monthly: Sequelize.INTEGER,
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    console.log('"Users" table created.');

    // 2. Create Files table
    console.log('Creating "Files" table...');
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
    console.log('"Files" table created.');

    // 3. Create Scans table
    console.log('Creating "Scans" table...');
    await queryInterface.createTable('Scans', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      file_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Files', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      result: { type: Sequelize.JSONB, allowNull: true },
      started_at: Sequelize.DATE,
      completed_at: Sequelize.DATE,
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    console.log('"Scans" table created.');

    // (您可以繼續在此處加入其他如 UsageRecords, SubscriptionPlans 等資料表的建立指令)
    console.log('===== Database schema build complete. =====');
  },

  async down (queryInterface, Sequelize) {
    console.log('===== Tearing down the entire database schema... =====');
    // 注意：降級操作的順序與升級相反
    await queryInterface.dropTable('Scans');
    await queryInterface.dropTable('Files');
    await queryInterface.dropTable('Users');
    console.log('===== Schema teardown complete. =====');
  }
};
