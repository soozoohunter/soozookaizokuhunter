/****************************************************************
 * express/routes/admin.js
 * - Admin Login 修正：支援 (username or phone or email)
 * - 若該帳號 role=admin => 簽發 JWT / 回傳成功
 ****************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

/**
 * Middleware：檢查 JWT & role=admin
 */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'You are not admin' });
    }
    // 可在 req.admin = decoded 中保存 userId, role 供後續使用
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /admin/login
 * 前端送 { username, password }
 * 後端同時以 phone or username or email 查找
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    // 同時比對 phone / username / email (確保 DB 有 username 欄位)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: username },
          { username: username },
          { email: username }
        ]
      }
    });
    if (!user) {
      // 查無此使用者
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 比對密碼 (bcrypt)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 必須 role=admin 才能登入
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '非管理員無法登入' });
    }

    // 簽發 JWT
    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, {
      expiresIn: '1d' // token 有效期 1 天
    });
    return res.json({ message: 'Admin登入成功', token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

// 其他 Admin API 範例 (需 requireAdmin)
router.get('/protected', requireAdmin, (req, res) => {
  return res.json({ message: 'admin protected data' });
});

// 預設方案額度，可依需求擴充
const PLAN_PRESETS = {
  free_trial: { image_upload_limit: 10, scan_limit_monthly: 20 },
  creator: { image_upload_limit: 500, scan_limit_monthly: 100 },
  business: { image_upload_limit: 1000, scan_limit_monthly: 500 },
};

// 更新使用者方案與狀態
router.post('/users/:userId/plan', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, status } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const preset = PLAN_PRESETS[plan];
    if (!preset) return res.status(400).json({ error: 'Invalid plan' });

    user.plan = plan;
    user.status = status || user.status;
    user.image_upload_limit = preset.image_upload_limit;
    user.scan_limit_monthly = preset.scan_limit_monthly;
    await user.save();

    res.json({ message: 'Plan updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// 手動調整額度
router.post('/users/:userId/quotas', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { image_upload_limit, scan_limit_monthly } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (image_upload_limit !== undefined) user.image_upload_limit = image_upload_limit;
    if (scan_limit_monthly !== undefined) user.scan_limit_monthly = scan_limit_monthly;
    await user.save();

    res.json({ message: 'Quotas updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update quotas' });
  }
});

// 取得所有使用者列表
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
