/********************************************************************
 * controllers/authController.js
 * 以 userName + password 做登入；序號 (serialNumber) 於後端自動生成
 ********************************************************************/
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');                // 假設使用 Sequelize 定義 User 模型
const User = db.User;
const blockchainService = require('../services/blockchainService');

/** 自動產生序號 **/
function generateSerial() {
  // 格式: yyyyMMddHHmmss + 4位隨機數
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}${rand}`;
}

/**
 * [POST] /auth/register
 * 參數: userName, password, email, (其餘社群平台欄位, ex: ig, fb, youtube...)
 * - 不再接收 serialNumber，改用 generateSerial() 自動產生
 * - 寫入區塊鏈後回傳 transactionHash
 */
exports.register = async (req, res) => {
  try {
    const {
      userName,
      password,
      email,
      ig, fb, youtube, tiktok, shopee, ruten, ebay, amazon, taobao,
      role // 可選，如前端需要
    } = req.body;

    // 1) 檢查必填欄位 (userName, password, email)
    if (!userName || !password || !email) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的註冊資訊 (userName, password, email)。'
      });
    }

    // 2) 檢查 userName, email 是否重複
    const existingByName = await User.findOne({ where: { userName } });
    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: '使用者名稱 (userName) 已被註冊。'
      });
    }
    const existingByEmail = await User.findOne({ where: { email } });
    if (existingByEmail) {
      return res.status(400).json({
        success: false,
        message: '電子信箱 (email) 已被註冊。'
      });
    }

    // 3) bcrypt 雜湊密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) 自動產生序號
    const serialNumber = generateSerial();

    // 5) 建立新會員資料
    const newUser = await User.create({
      userName,
      password: hashedPassword,
      email,
      serialNumber,
      role: role || 'copyright',    // 若無前端指定 role，就預設 'copyright'
      ig: ig || '',
      fb: fb || '',
      youtube: youtube || '',
      tiktok: tiktok || '',
      shopee: shopee || '',
      ruten: ruten || '',
      ebay: ebay || '',
      amazon: amazon || '',
      taobao: taobao || ''
    });

    // 6) 寫入區塊鏈
    let txHash;
    try {
      txHash = await blockchainService.storeUserOnChain({
        userName: newUser.userName,
        email: newUser.email,
        serialNumber: newUser.serialNumber,
        ig: newUser.ig || '',
        fb: newUser.fb || '',
        youtube: newUser.youtube || '',
        tiktok: newUser.tiktok || '',
        shopee: newUser.shopee || '',
        ruten: newUser.ruten || '',
        ebay: newUser.ebay || '',
        amazon: newUser.amazon || '',
        taobao: newUser.taobao || ''
      });
    } catch (error) {
      console.error('Blockchain Error:', error);
      // 若區塊鏈寫入失敗，刪除先前新增的使用者，避免資料不一致
      await newUser.destroy();
      return res.status(500).json({
        success: false,
        message: '區塊鏈寫入失敗，請稍後重試。',
        error: error.message
      });
    }

    // 7) 回應: 註冊成功 + 上鏈交易雜湊
    return res.status(201).json({
      success: true,
      message: '註冊成功，資料已上鏈。',
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤，請稍後再試。',
      error: error.message
    });
  }
};

/**
 * [POST] /auth/login
 * 以 userName + password 登入
 */
exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // 檢查必填
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供使用者名稱 (userName) 和密碼 (password)。'
      });
    }

    // 1) 查詢 userName
    const user = await User.findOne({ where: { userName } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '使用者名稱或密碼錯誤。'
      });
    }

    // 2) 驗證密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '使用者名稱或密碼錯誤。'
      });
    }

    // 3) 簽發 JWT (可選)
    let token = null;
    if (process.env.JWT_SECRET) {
      token = jwt.sign(
        {
          id: user.id,
          userName: user.userName
          // 也可加更多 payload
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    }

    // 4) 回傳成功
    return res.json({
      success: true,
      message: '登入成功。',
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        serialNumber: user.serialNumber
      },
      // 若有生成 token，則包含於回傳
      ...(token ? { token } : {})
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤，請稍後再試。',
      error: error.message
    });
  }
};
