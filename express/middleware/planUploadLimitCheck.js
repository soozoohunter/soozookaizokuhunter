// express/middleware/planUploadLimitCheck.js
const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '使用者不存在' });
    }

    // 假設 user 有 createdAt 欄位
    const now = new Date();
    const oneMonthAfterReg = new Date(user.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 若超過一個月，且尚未付費 => 擋下
    if (now > oneMonthAfterReg) {
      // 假設 user.hasPaid = true/false
      if (!user.hasPaid) {
        return res.status(402).json({
          error: 'Your free month has ended. Please upgrade or pay for continuing usage.',
        });
      }
    }

    // 繼續
    next();
  } catch (err) {
    console.error('[planUploadLimitCheck] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
