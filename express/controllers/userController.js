// controllers/userController.js
const { ValidationError } = require('sequelize');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// 驗證並解析 userId
const validateUserId = (userId) => {
  if (!userId || isNaN(userId)) {
    throw new Error('無效的用戶ID');
  }
  return parseInt(userId, 10);
};

const UserController = {
  /**
   * 取得目前登入用戶的個人資料
   */
  getProfile: async (req, res, next) => {
    try {
      const userId = validateUserId(req.user.userId);
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        logger.warn(`[UserController] 用戶不存在: ${userId}`);
        return res.status(404).json({ message: '使用者不存在' });
      }

      const safeUser = {
        id: user.id,
        email: user.email,
        real_name: user.real_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        last_login: user.last_login,
        created_at: user.created_at
      };

      res.json({ user: safeUser });
    } catch (err) {
      logger.error('[UserController] 獲取個人資料失敗', {
        error: err.message,
        stack: err.stack,
        userId: req.user.userId
      });
      next(err);
    }
  },

  /**
   * 更新個人資料
   */
  updateProfile: async (req, res, next) => {
    try {
      const userId = validateUserId(req.user.userId);
      const { real_name, phone } = req.body;

      if (!real_name || real_name.trim().length < 2) {
        return res.status(400).json({ message: '姓名至少需要2個字元' });
      }

      if (!phone || !/^09\d{8}$/.test(phone)) {
        return res.status(400).json({ message: '電話號碼格式不正確' });
      }

      const [updated] = await User.update({
        real_name: real_name.trim(),
        phone: phone.trim()
      }, {
        where: { id: userId },
        returning: true,
        individualHooks: true
      });

      if (updated === 0) {
        logger.warn(`[UserController] 用戶更新失敗，未找到用戶: ${userId}`);
        return res.status(404).json({ message: '使用者不存在' });
      }

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.json({ message: '基本資料已更新', user: updatedUser });
    } catch (err) {
      if (err instanceof ValidationError) {
        const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
        logger.warn('[UserController] 更新驗證失敗', { errors });
        return res.status(400).json({ message: '資料驗證失敗', errors });
      }

      logger.error('[UserController] 更新個人資料失敗', {
        error: err.message,
        stack: err.stack,
        userId: req.user.userId,
        body: req.body
      });
      next(err);
    }
  }
};

module.exports = UserController;