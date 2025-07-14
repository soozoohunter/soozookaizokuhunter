const { Op } = require('sequelize');
const { Scan } = require('../models');
const logger = require('../utils/logger');

async function monitorStuckTasks() {
  const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
  const stuck = await Scan.findAll({
    where: {
      status: 'processing',
      updated_at: { [Op.lt]: threshold }
    }
  });

  for (const task of stuck) {
    logger.warn(`[TaskMonitor] Found stuck scan ${task.id}, marking as failed`);
    await task.update({ status: 'failed', progress: 100, error_message: 'timeout' });
  }
}

module.exports = { monitorStuckTasks };
