'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false,
      },
      serialNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
      IG: { type: Sequelize.STRING, allowNull: true },
      FB: { type: Sequelize.STRING, allowNull: true },
      YouTube: { type: Sequelize.STRING, allowNull: true },
      TikTok: { type: Sequelize.STRING, allowNull: true },
      Shopee: { type: Sequelize.STRING, allowNull: true },
      Ruten: { type: Sequelize.STRING, allowNull: true },
      Yahoo: { type: Sequelize.STRING, allowNull: true },
      Amazon: { type: Sequelize.STRING, allowNull: true },
      Taobao: { type: Sequelize.STRING, allowNull: true },
      eBay: { type: Sequelize.STRING, allowNull: true },
      realName: { type: Sequelize.STRING, allowNull: true },
      birthDate: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.STRING, allowNull: true },
      plan: { type: Sequelize.STRING, allowNull: false, defaultValue: 'freeTrial' },
      uploadVideos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      uploadImages: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
