// controllers/trademarkController.js
const trademarkService = require('../services/trademarkService');

const TrademarkController = {
  search: async (req, res, next) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: '缺少查詢參數 q' });
      }
      // 調用商標爬蟲服務進行查詢
      const results = await trademarkService.searchTrademark(query);
      return res.json({ query, results });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = TrademarkController;
