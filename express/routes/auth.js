const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// 假設存儲在內存,或連接DB
const users = [];

// 註冊
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if(!username || !password){
    return res.status(400).json({ error:'缺少 username 或 password' });
  }
  // ...檢查是否重複,省略
  users.push({ username, password });
  res.json({ message:'註冊成功' });
});

// 登入
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if(!user){
    return res.status(401).json({ error:'無效帳密' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn:'1h' });
  res.json({ message:'登入成功', token });
});

module.exports = router;
