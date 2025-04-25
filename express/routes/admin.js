/****************************************************************
 * express/routes/admin.js
 * - Admin Login 修正：支援 (username or phone or email)
 * - 預設若該帳號對應 role=admin 才能登入成功
 ****************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

// Middleware：檢查 JWT & role=admin
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
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /admin/login
 * - 前端送 { username, password }
 * - 後端以 phone or username or email 查找
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    // 同時比對 phone / username / email
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
      return res.status(401).json({ error: '無此帳號' });
    }

    // 比對密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    // 必須要是 admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '非管理員無法登入' });
    }

    // 簽發 JWT
    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, {
      expiresIn: '1d'
    });
    return res.json({ message: 'Admin登入成功', token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

/**
 * 其他 Admin API (requireAdmin)
 *  e.g. GET /admin/users, GET /admin/files, ...
 */

module.exports = router;
