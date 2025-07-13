"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable("SubscriptionPlans");

      if (!columns.annual_price) {
        await queryInterface.addColumn(
          "SubscriptionPlans",
          "annual_price",
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!columns.video_limit) {
        await queryInterface.addColumn(
          "SubscriptionPlans",
          "video_limit",
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!columns.image_limit) {
        await queryInterface.addColumn(
          "SubscriptionPlans",
          "image_limit",
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      if (!columns.scan_frequency) {
        await queryInterface.addColumn(
          "SubscriptionPlans",
          "scan_frequency",
          { type: Sequelize.STRING(16), allowNull: true },
          { transaction }
        );
      }

      if (!columns.dmca_free) {
        await queryInterface.addColumn(
          "SubscriptionPlans",
          "dmca_free",
          { type: Sequelize.INTEGER, allowNull: true },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable("SubscriptionPlans");

      if (columns.annual_price) {
        await queryInterface.removeColumn(
          "SubscriptionPlans",
          "annual_price",
          { transaction }
        );
      }

      if (columns.video_limit) {
        await queryInterface.removeColumn(
          "SubscriptionPlans",
          "video_limit",
          { transaction }
        );
      }

      if (columns.image_limit) {
        await queryInterface.removeColumn(
          "SubscriptionPlans",
          "image_limit",
          { transaction }
        );
      }

      if (columns.scan_frequency) {
        await queryInterface.removeColumn(
          "SubscriptionPlans",
          "scan_frequency",
          { transaction }
        );
      }

      if (columns.dmca_free) {
        await queryInterface.removeColumn(
          "SubscriptionPlans",
          "dmca_free",
          { transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
