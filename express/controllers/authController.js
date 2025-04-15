/********************************************************************
 * controllers/authController.js
 * 使用 userName + password 來登入。
 * 註冊時必填 email(做聯絡/綁定，但不做登入)，
 * 以及 userName(登入用), password, confirmPassword, 
 * 可選擇性填 IG/FB/Shopee/...
 * 另外將User資訊上鏈 (blockchainService)，純範例。
 ********************************************************************/
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Sequelize model
const blockchainService = require('../services/blockchainService'); // 範例(可自行實作)
const JWT_SECRET = process.env.JWT_SECRET || 'KaiKaiShieldSecret';

function generateSerialNumber() {
  // 簡易生成 "YYYYMMDDHHmmssXXXX" 之類的序號
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  // 也可加一個4位隨機碼
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}${rand}`;
}

const authController = {

  // 註冊：必填 email, userName, password, confirmPassword
  // 可選 ig/fb/youtube/tiktok... (若要檢查唯一，也要查 DB)
  async register(req, res) {
    try {
      const {
        email,
        userName,
        password,
        confirmPassword,
        ig,
        fb,
        youtube,
        tiktok,
        shopee,
        ruten,
        ebay,
        amazon,
        taobao
      } = req.body;

      // 1) 檢查必填
      if (!email || !userName || !password || !confirmPassword) {
        return res.status(400).json({ message: '缺少必填欄位 (email, userName, password, confirmPassword)' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: '兩次密碼不一致' });
      }

      // 2) 檢查 email, userName 是否重複
      // 先檢查 userName
      let existUser = await User.findOne({ where: { userName } });
      if (existUser) {
        return res.status(400).json({ message: '使用者名稱已被註冊' });
      }
      // 再檢查 email
      existUser = await User.findOne({ where: { email } });
      if (existUser) {
        return res.status(400).json({ message: '此 Email 已被註冊' });
      }

      // 3) 若要檢查 ig/fb/etc 不得重複綁定，也可一併查
      // (示例: if(ig) { const x=await User.findOne({ where:{ ig }}); if(x) return ... }

      // 4) bcrypt 雜湊密碼
      const hashed = await bcrypt.hash(password, 10);

      // 5) 生成唯一 serialNumber
      const serialNumber = generateSerialNumber();

      // 6) 建立新用戶 (plan= BASIC, role=copyright)
      const newUser = await User.create({
        email,
        userName,
        password: hashed,
        ig,
        fb,
        youtube,
        tiktok,
        shopee,
        ruten,
        ebay,
        amazon,
        taobao,
        serialNumber,
        plan: 'BASIC',
        role: 'copyright'
      });

      // 7) 上鏈 (純範例)
      try {
        await blockchainService.storeUserOnChain({
          userName,
          email,
          serialNumber
          // 其他資訊...
        });
      } catch (chainErr) {
        console.error('[register => blockchain error]', chainErr);
        // 上鏈失敗不影響註冊流程
      }

      return res.status(201).json({
        message: '註冊成功，請使用「使用者名稱 + 密碼」登入',
        userId: newUser.id,
        serialNumber: newUser.serialNumber,
        plan: newUser.plan
      });
    } catch (err) {
      console.error('[register error]', err);
      return res.status(500).json({ message: '註冊失敗' });
    }
  },

  // 登入：使用 userName + password
  async login(req, res) {
    try {
      const { userName, password } = req.body;
      if (!userName || !password) {
        return res.status(400).json({ message: '請提供 userName 與 password' });
      }

      // 查詢
      const user = await User.findOne({ where: { userName } });
      if (!user) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
      }

      // 比對密碼
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
      }

      // 簽發 JWT
      const token = jwt.sign(
        { userId: user.id, userName: user.userName, serialNumber: user.serialNumber },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({ message: '登入成功', token });
    } catch (err) {
      console.error('[login error]', err);
      return res.status(500).json({ message: '登入失敗，請稍後再試' });
    }
  }

};

module.exports = authController;
