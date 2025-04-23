/*************************************************************
 * express/routes/admin.js
 *************************************************************/
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models'); // Sequelize 的 User Model
const dbPool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '找不到此帳號' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '無權限：非admin身分' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (err) {
    console.error('[AdminLogin Error]:', err);
    return res.status(500).json({ error: '登入錯誤' });
  }
});

function authAdminMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供或格式錯誤 (Authorization header)' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '存取被拒絕：僅限管理員' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authAdminMiddleware] 驗證失敗:', err);
    return res.status(401).json({ error: '未授權或Token已失效' });
  }
}

router.get('/users', authAdminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    return res.json(users);
  } catch (err) {
    console.error('[GET /admin/users Error]:', err);
    return res.status(500).json({ error: '無法取得使用者列表' });
  }
});

router.get('/payments', authAdminMiddleware, async (req, res) => {
  try {
    const result = await dbPool.query('SELECT * FROM pending_payments ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (err) {
    console.error('[GET /admin/payments Error]:', err);
    return res.status(500).json({ error: '無法取得付款紀錄' });
  }
});

router.get('/files', authAdminMiddleware, async (req, res) => {
  try {
    const result = await dbPool.query('SELECT * FROM files ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    console.error('[GET /admin/files Error]:', err);
    return res.status(500).json({ error: '無法取得檔案列表' });
  }
});

module.exports = router;
