// express/routes/admin.js
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '缺少帳號或密碼' });
    }

    // 尋找 user: 這裡示範用 username 查找
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: '無此帳號或密碼錯誤' });
    }

    // 比對密碼
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '無此帳號或密碼錯誤' });
    }

    // 若是 Admin 帳號，role 必須是 'admin'
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '非管理員無法登入' });
    }

    // 成功 => 發 token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[AdminLogin Error]', err);
    return res.status(500).json({ error: '登入過程發生錯誤' });
  }
});
