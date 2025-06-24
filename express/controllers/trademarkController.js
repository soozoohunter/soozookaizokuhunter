/********************************************************************
 * controllers/trademarkController.js
 ********************************************************************/
const trademarkService = require('../services/trademarkService');
const logger = require('../utils/logger');

const trademarkController = {
  async search(req, res) {
    try {
      const q = req.query.q;
      if (!q) {
        return res.status(400).json({ error: '缺少查詢參數 q' });
      }
      const results = await trademarkService.searchTrademark(q);
      return res.json({ query: q, results });
    } catch (err) {
      logger.error('[trademarkController.search] error:', err);
      return res.status(500).json({ error: '無法查詢商標' });
    }
  }
};

module.exports = trademarkController;
