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

      const removeIfExists = async (column) => {
        if (columns[column]) {
          await queryInterface.removeColumn(
            "SubscriptionPlans",
            column,
            { transaction }
          );
        }
      };

      await removeIfExists("annual_price");
      await removeIfExists("video_limit");
      await removeIfExists("image_limit");
      await removeIfExists("scan_frequency");
      await removeIfExists("dmca_free");

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
