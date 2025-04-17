const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 載入 Sequelize 的 User 模型 (請依實際路徑)
const { User } = require('../models');

// JWT 秘鑰 (建議放在 .env)
const JWT_SECRET = process.env.JWT_SECRET || 'YourJWTSecretKey';

// 驗證必須為 admin
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: '未提供認證權杖 (Authorization header)' });
  }
  const token = authHeader.replace(/^Bearer\s/, '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 只有 role=admin 才能操作
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ message: '存取被拒絕：僅限管理員' });
    }
    req.user = decoded; // 可以在後續路由使用
    next();
  } catch (err) {
    console.error('JWT 驗證失敗：', err);
    return res.status(401).json({ message: '未授權或Token已失效' });
  }
}

// 先使用此中介層保護所有 /admin/users 路由
router.use(verifyAdminToken);

/** GET /admin/users - 取得所有使用者清單 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      // 排除 password 欄位
      attributes: { exclude: ['password'] }
    });
    return res.json(users);
  } catch (err) {
    console.error('取得使用者列表錯誤：', err);
    return res.status(500).json({ message: '無法取得使用者列表' });
  }
});

/** POST /admin/users - 新增使用者 */
router.post('/users', async (req, res) => {
  try {
    const { email, userName, password, role, plan, serialNumber, socialBinding } = req.body;

    if (!email || !userName || !password || !role || !plan) {
      return res.status(400).json({ message: '缺少必要的使用者資訊' });
    }
    // 檢查 email 是否重複
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: '此 Email 已被使用' });
    }
    // 雜湊密碼 (若模型 beforeCreate 已做，可省略，但此做法安全無虞)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 預設 isPaid：若 plan=free => isPaid=true(免付費)；你可自行決定
    const isPaidVal = (plan.toLowerCase() === 'free') ? true : true;

    const newUser = await User.create({
      email,
      userName,
      password: hashedPassword,
      role,
      plan,
      serialNumber: serialNumber || null,
      socialBinding: socialBinding || null,
      isPaid: isPaidVal
    });
    // 回傳時排除敏感資訊
    const userData = {
      id: newUser.id,
      email: newUser.email,
      userName: newUser.userName,
      role: newUser.role,
      plan: newUser.plan,
      serialNumber: newUser.serialNumber,
      socialBinding: newUser.socialBinding,
      isPaid: newUser.isPaid
    };
    return res.status(201).json(userData);
  } catch (err) {
    console.error('新增使用者時錯誤：', err);
    return res.status(500).json({ message: '新增使用者失敗' });
  }
});

/** PUT /admin/users/:id - 修改使用者 */
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, userName, role, plan, serialNumber, socialBinding, isPaid } = req.body;

    // 組裝可更新欄位
    const updateFields = {};
    if (email !== undefined) updateFields.email = email;
    if (userName !== undefined) updateFields.userName = userName;
    if (role !== undefined) updateFields.role = role;
    if (plan !== undefined) updateFields.plan = plan;
    if (serialNumber !== undefined) updateFields.serialNumber = serialNumber;
    if (socialBinding !== undefined) updateFields.socialBinding = socialBinding;
    if (isPaid !== undefined) updateFields.isPaid = isPaid;  // true/false

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: '未提供任何需要更新的欄位' });
    }
    // 檢查 email 衝突
    if (updateFields.email) {
      const conflict = await User.findOne({
        where: { email: updateFields.email, id: { 
          [require('sequelize').Op.ne]: userId 
        }}
      });
      if (conflict) {
        return res.status(400).json({ message: '此 Email 已被使用於其他帳戶' });
      }
    }
    const [affectedCount] = await User.update(updateFields, { where: { id: userId } });
    if (affectedCount === 0) {
      return res.status(404).json({ message: '找不到指定的使用者' });
    }
    // 回傳更新後資料(排除 password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    return res.json(updatedUser);
  } catch (err) {
    console.error('更新使用者錯誤：', err);
    return res.status(500).json({ message: '更新使用者失敗' });
  }
});

/** DELETE /admin/users/:id - 刪除使用者 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedCount = await User.destroy({ where: { id: userId } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: '找不到指定的使用者' });
    }
    // 204 無內容
    return res.status(204).send();
  } catch (err) {
    console.error('刪除使用者錯誤：', err);
    return res.status(500).json({ message: '刪除使用者失敗' });
  }
});

module.exports = router;
