// controllers/userController.js
const User = require('../models/User');
const UserController = {
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) return res.status(404).json({ message: '使用者不存在' });
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
  updateProfile: async (req, res, next) => {
    try {
      const { name, contact } = req.body;
      const user = await User.findByIdAndUpdate(req.user.userId, { name, contact }, { new: true }).select('-passwordHash');
      res.json({ message: '基本資料已更新', user });
    } catch (err) {
      next(err);
    }
  }
};
