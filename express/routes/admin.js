/*************************************************************
 * express/routes/admin.js
 * 
 * 管理員相關路由：
 *  - POST /admin/login  (支援 phone / username / email)
 *  - GET  /admin/users   (取得全部使用者清單)
 *  - GET  /admin/files   (取得全部檔案清單)
 *  - GET  /admin/stats   (取得各項統計狀態)
 *************************************************************/
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, File } = require('../models');

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
    req.admin = decoded; // 紀錄 admin payload
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * POST /admin/login
 * - 同時支援 phone / username / email 當作帳號
 * - 前端送來 { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    // 在資料庫中查找 (phone=xxx OR username=xxx OR email=xxx)
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
    const token = jwt.sign(
      { userId: user.id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ message: 'Admin登入成功', token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

/**
 * GET /admin/users
 * - 取得所有使用者清單
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('[Admin Users Error]', err);
    return res.status(500).json({ error: '取得使用者列表失敗' });
  }
});

/**
 * GET /admin/files
 * - 取得所有上傳檔案記錄
 */
router.get('/files', requireAdmin, async (req, res) => {
  try {
    const files = await File.findAll();
    res.json(files);
  } catch (err) {
    console.error('[Admin Files Error]', err);
    return res.status(500).json({ error: '取得檔案列表失敗' });
  }
});

/**
 * GET /admin/stats
 * - 統計各項使用狀況 (使用者數, 檔案數, 總圖片上傳, 總影片上傳, 侵權檔案數...)
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // 1) 總使用者數
    const totalUsers = await User.count();
    // 2) 總管理員數
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    // 3) 總檔案數
    const totalFiles = await File.count();
    // 4) 上傳圖片數 (把 User.uploadImages 全部加總)
    const sumImages = await User.sum('uploadImages');
    // 5) 上傳影片數 (把 User.uploadVideos 全部加總)
    const sumVideos = await User.sum('uploadVideos');
    // 6) 侵權檔案 (File.infringingLinks !== '[]')
    //   infringingLinks 一般 JSON 儲存, 可能是 "[]", or "["someLink"]"...
    //   用 Op.ne '[]' 來判斷
    const { Op } = require('sequelize');
    const totalInfringing = await File.count({
      where: {
        infringingLinks: {
          [Op.ne]: '[]'
        }
      }
    });

    res.json({
      totalUsers,
      totalAdmins,
      totalFiles,
      sumImages,
      sumVideos,
      totalInfringing
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: '取得統計資料失敗' });
  }
});

module.exports = router;
