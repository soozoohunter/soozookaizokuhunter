"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const columns = await queryInterface.describeTable("DMCARequests");
      if (!columns.report_id) {
        await queryInterface.addColumn(
          "DMCARequests",
          "report_id",
          {
            type: Sequelize.INTEGER,
            references: { model: "InfringementReports", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            allowNull: true,
          },
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
      const columns = await queryInterface.describeTable("DMCARequests");
      if (columns.report_id) {
        await queryInterface.removeColumn("DMCARequests", "report_id", { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
