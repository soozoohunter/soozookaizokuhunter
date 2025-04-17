const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// 載入 User 資料模型（假設已定義 Sequelize 模型）
const { User } = require('../models');  // 依照專案的實際路徑

// JWT 秘密金鑰（實務上應放在環境變數或設定檔）
const JWT_SECRET = process.env.JWT_SECRET || 'YourJWTSecretKey';

// 管理員驗證中介函式：驗證 JWT，並確認使用者角色為 admin
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: '未提供認證權杖 (Authorization header)' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 檢查角色
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ message: '存取被拒絕：僅限管理員' });
    }
    // 可將解碼後的資料附加到請求物件供後續使用
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT 驗證失敗：', err);
    return res.status(401).json({ message: '未授權的存取或權杖已失效' });
  }
}

// 對所有此路由的請求先進行 JWT 管理員驗證
router.use(verifyAdminToken);

// GET /admin/users - 取得所有使用者帳號清單
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }  // 排除密碼欄位，確保不回傳敏感資料
    });
    return res.json(users);
  } catch (err) {
    console.error('取得使用者列表時發生錯誤：', err);
    return res.status(500).json({ message: '無法取得使用者列表' });
  }
});

// POST /admin/users - 新增一個使用者帳號
router.post('/users', async (req, res) => {
  try {
    const { email, userName, password, role, plan, serialNumber, socialBinding } = req.body;
    // 簡單驗證必填欄位
    if (!email || !userName || !password || !role || !plan) {
      return res.status(400).json({ message: '缺少必要的使用者資訊' });
    }
    // 檢查 email 是否已存在（避免重複帳號）
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: '此 Email 已被使用' });
    }
    // 將密碼雜湊處理以確保安全 (若 User 模型有 hook 則可省略手動雜湊)
    const hashedPassword = bcrypt.hashSync(password, 10);
    // 建立新使用者
    const newUser = await User.create({
      email,
      userName,
      password: hashedPassword,
      role,
      plan,
      serialNumber: serialNumber || null,
      socialBinding: socialBinding || null,
      isPaid: plan.toLowerCase() === 'free' ? true : true  // free 帳號預設已付費（免付費）；付費方案預設標記為已付費 (此處預設為 true，可視需要改為 false)
    });
    // 移除敏感資訊後回傳新使用者資料
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
    console.error('新增使用者時發生錯誤：', err);
    return res.status(500).json({ message: '新增使用者失敗' });
  }
});

// PUT /admin/users/:id - 修改現有使用者資訊
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    // 準備允許更新的欄位資料
    const { email, userName, role, plan, serialNumber, socialBinding, isPaid } = req.body;
    const updateFields = {};
    if (email !== undefined) updateFields.email = email;
    if (userName !== undefined) updateFields.userName = userName;
    if (role !== undefined) updateFields.role = role;
    if (plan !== undefined) updateFields.plan = plan;
    if (serialNumber !== undefined) updateFields.serialNumber = serialNumber;
    if (socialBinding !== undefined) updateFields.socialBinding = socialBinding;
    if (isPaid !== undefined) updateFields.isPaid = isPaid;
    // 如沒有任何欄位提供
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: '未提供任何需要更新的欄位' });
    }
    // 如果有 email 欄位，檢查新的 email 是否會與其他使用者衝突
    if (updateFields.email) {
      const conflict = await User.findOne({ where: { email: updateFields.email, id: { [require('sequelize').Op.ne]: userId } } });
      if (conflict) {
        return res.status(400).json({ message: '此 Email 已被使用於其他帳戶' });
      }
    }
    // 執行更新
    const [affectedCount] = await User.update(updateFields, { where: { id: userId } });
    if (affectedCount === 0) {
      // 找不到該使用者
      return res.status(404).json({ message: '找不到指定的使用者' });
    }
    // 重新查詢取得更新後的使用者資料
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    return res.json(updatedUser);
  } catch (err) {
    console.error('更新使用者時發生錯誤：', err);
    return res.status(500).json({ message: '更新使用者失敗' });
  }
});

// DELETE /admin/users/:id - 刪除使用者
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedCount = await User.destroy({ where: { id: userId } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: '找不到指定的使用者' });
    }
    // 刪除成功，不回傳特定內容，只回傳狀態碼
    return res.status(204).send();  // 204 No Content 表示成功無回傳內容
  } catch (err) {
    console.error('刪除使用者時發生錯誤：', err);
    return res.status(500).json({ message: '刪除使用者失敗' });
  }
});

module.exports = router;
