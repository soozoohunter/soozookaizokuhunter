const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const VerificationCode = require('./VerificationCode'); // 匯入驗證碼模組
// （若有 User 模型或資料存取層，可在此引入，例如：const User = require('./User');）

// 發送驗證碼郵件
router.post('/sendCode', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // 產生6位數隨機驗證碼
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // 保存驗證碼（暫存於記憶體或資料庫）
        VerificationCode.saveCode(email, code);
        // 檢查環境變數中的郵件帳戶設定 (使用 Gmail 時建議使用應用程式專用密碼)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('未設定 EMAIL_USER/EMAIL_PASS 環境變數');
            return res.status(500).json({ error: 'Email service not configured' });
        }
        // 設定 SMTP 傳輸器（使用 Gmail）
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        // 寄出含驗證碼的電子郵件
        await transporter.sendMail({
            from: `"Suzoo應用" <${process.env.EMAIL_USER}>`, // 發信人，可自行調整名稱
            to: email,
            subject: '您的驗證碼',
            text: `您的驗證碼是：${code}`
        });
        return res.json({ message: '驗證碼已發送' });
    } catch (err) {
        console.error('Error in /auth/sendCode:', err);
        return res.status(500).json({ error: '寄送驗證碼失敗' });
    }
});

// 驗證輸入的驗證碼是否正確
router.post('/checkCode', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }
    const valid = VerificationCode.verifyCode(email, code);
    if (!valid) {
        return res.status(400).json({ error: '驗證碼錯誤或已過期' });
    }
    return res.json({ message: '驗證碼正確，請繼續註冊流程' });
});

// 驗證碼正確後的最終註冊
router.post('/finalRegister', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // 確認該 email 已通過驗證碼驗證
        if (!VerificationCode.isVerified(email)) {
            return res.status(400).json({ error: 'Email not verified' });
        }
        // **將新使用者資料寫入資料庫**（需依據實際資料庫實作）
        // 建議先檢查使用者是否已存在，以及使用雜湊後的密碼 (例如 bcrypt.hashSync)
        // 例如：
        // const hashedPassword = bcrypt.hashSync(password, 10);
        // await User.create({ email, password: hashedPassword });
        // （上方為示意，User 模型及資料庫操作需依專案而定）
        // 清除驗證碼記錄
        VerificationCode.clearCode(email);
        return res.json({ message: '註冊成功' });
    } catch (err) {
        console.error('Error in /auth/finalRegister:', err);
        return res.status(500).json({ error: '註冊過程發生錯誤' });
    }
});

// 使用者登入
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // **驗證使用者帳密**（需依據實際資料庫實作）
        // 例如：
        // const user = await User.findOne({ where: { email } });
        // if (!user) {
        //     return res.status(401).json({ error: '無效的 Email 或密碼' });
        // }
        // // 比對密碼（若有雜湊）
        // const passwordMatch = bcrypt.compareSync(password, user.password);
        // if (!passwordMatch) {
        //     return res.status(401).json({ error: '無效的 Email 或密碼' });
        // }
        // // 若未使用雜湊（不建議）則直接比對明文：
        // if (user.password !== password) {
        //     return res.status(401).json({ error: '無效的 Email 或密碼' });
        // }
        // JWT 簽發，包含使用者 ID 和 email
        const token = jwt.sign(
            { id: user.id, email: user.email },   // 確保 payload 中包含 email
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token });
    } catch (err) {
        console.error('Error in /auth/login:', err);
        return res.status(500).json({ error: '登入失敗' });
    }
});

module.exports = router;
