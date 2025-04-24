const express = require('express');
const router = express.Router();
const { User, File } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SomeSuperSecretKey';

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

// POST /admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '無此帳號' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: '非管理員無法登入' });
    }

    const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Admin登入成功', token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// GET /admin/files
router.get('/files', requireAdmin, async (req, res) => {
  const files = await File.findAll();
  res.json(files);
});

module.exports = router;
