/********************************************************************
 * routes/admin.js
 * - 管理員登入 (POST /admin/login)
 * - 使用者管理 (GET/POST/PUT/DELETE /admin/users[/:id])
 *   僅允許 admin 角色可操作
 ********************************************************************/
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models'); // Sequelize User Model

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/** =========================
 * 1) 管理員登入
 * POST /admin/login
 * body: { email, password }
 * ========================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 查詢帳號是否存在
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '找不到此帳號' });
    }
    // 檢查是否為 admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '無權限：非admin身分' });
    }
    // 驗證密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '密碼錯誤' });
    }
    // 簽發 JWT (有效期 1小時)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ token });
  } catch (err) {
    console.error('[AdminLogin Error]:', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});

/** =========================
 * 2) Admin-only 中介層
 * ========================= */
function authAdminMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '未提供授權憑證 (Authorization header)' });
  }
  const token = authHeader.replace(/^Bearer\s/, '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '存取被拒絕：僅限管理員' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authAdminMiddleware] JWT 驗證失敗：', err);
    return res.status(401).json({ error: '未授權或Token已失效' });
  }
}

// 保護以下所有 /admin/users 路由
router.use('/users', authAdminMiddleware);

/** =========================
 * 3) GET /admin/users
 * 取得全部使用者清單 (只限admin)
 * ========================= */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    return res.json(users);
  } catch (err) {
    console.error('[GET /admin/users Error]:', err);
    return res.status(500).json({ error: '無法取得使用者列表' });
  }
});

/** =========================
 * 4) POST /admin/users
 * 新增使用者 (只限admin)
 * body: { email, userName, password, role, plan, ... }
 * ========================= */
router.post('/users', async (req, res) => {
  try {
    const { email, userName, password, role, plan, serialNumber, socialBinding } = req.body;
    if (!email || !userName || !password) {
      return res.status(400).json({ error: '缺少必要欄位 (email, userName, password)' });
    }

    // 檢查 email 是否已存在
    const conflict = await User.findOne({ where: { email } });
    if (conflict) {
      return res.status(400).json({ error: '此 Email 已被使用' });
    }

    // bcrypt 雜湊
    const hashedPwd = await bcrypt.hash(password, 10);

    // 預設 plan, role
    const finalRole = role || 'user';
    const finalPlan = plan || 'free';

    // 建立
    const newUser = await User.create({
      email,
      userName,
      password: hashedPwd,
      role: finalRole,
      plan: finalPlan,
      serialNumber: serialNumber || null,
      socialBinding: socialBinding || null
    });

    // 回傳單筆 or 所有使用者
    return res.status(201).json(newUser); // 只回傳「新增那筆」給前端
  } catch (err) {
    console.error('[POST /admin/users Error]:', err);
    return res.status(500).json({ error: '無法新增使用者' });
  }
});

/** =========================
 * 5) PUT /admin/users/:id
 * 編輯指定使用者
 * ========================= */
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, userName, role, plan, serialNumber, socialBinding, isPaid } = req.body;

    // 收集要更新的欄位
    const updateFields = {};
    if (email !== undefined) updateFields.email = email;
    if (userName !== undefined) updateFields.userName = userName;
    if (role !== undefined) updateFields.role = role;
    if (plan !== undefined) updateFields.plan = plan;
    if (serialNumber !== undefined) updateFields.serialNumber = serialNumber;
    if (socialBinding !== undefined) updateFields.socialBinding = socialBinding;
    if (isPaid !== undefined) updateFields.isPaid = isPaid;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: '未提供任何更新欄位' });
    }

    // 檢查 email 衝突
    if (updateFields.email) {
      const conflict = await User.findOne({
        where: {
          email: updateFields.email,
          id: { [Op.ne]: userId }
        }
      });
      if (conflict) {
        return res.status(400).json({ error: '此 Email 已被使用於其他帳號' });
      }
    }

    const [count] = await User.update(updateFields, { where: { id: userId } });
    if (count === 0) {
      return res.status(404).json({ error: '找不到此使用者，或無法更新' });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    return res.json(updatedUser);
  } catch (err) {
    console.error('[PUT /admin/users/:id Error]:', err);
    return res.status(500).json({ error: '更新使用者失敗' });
  }
});

/** =========================
 * 6) DELETE /admin/users/:id
 * 刪除使用者
 * ========================= */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedCount = await User.destroy({ where: { id: userId } });
    if (deletedCount === 0) {
      return res.status(404).json({ error: '找不到該使用者' });
    }
    return res.sendStatus(204); // 204 no content
  } catch (err) {
    console.error('[DELETE /admin/users/:id Error]:', err);
    return res.status(500).json({ error: '刪除使用者失敗' });
  }
});

module.exports = router;
