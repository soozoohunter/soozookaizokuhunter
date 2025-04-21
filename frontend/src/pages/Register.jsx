import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    IG: '',
    FB: '',
    YouTube: '',
    TikTok: '',
    Shopee: '',
    Ruten: '',
    Yahoo: '',
    Amazon: '',
    eBay: '',
    Taobao: ''
  });
  const [error, setError] = useState('');

  // 檢查是否填至少一個社群/電商
  function hasOnePlatform() {
    return (
      form.IG.trim() || form.FB.trim() || form.YouTube.trim() ||
      form.TikTok.trim() || form.Shopee.trim() || form.Ruten.trim() ||
      form.Yahoo.trim() || form.Amazon.trim() || form.eBay.trim() || form.Taobao.trim()
    );
  }

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.userName.trim() ||
        !form.password || !form.confirmPassword) {
      return setError('必填欄位未填');
    }
    if (form.password !== form.confirmPassword) {
      return setError('密碼不一致');
    }
    if (!hasOnePlatform()) {
      return setError('請至少填寫一個社群/電商帳號');
    }

    try {
      const resp = await fetch('/auth/register', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || '註冊失敗');
      }
      alert('註冊成功！');
      navigate('/login');
    } catch(err) {
      setError(err.message);
    }
  };

  const showPlatformAlert = !hasOnePlatform();

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>Register / 註冊</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Label>Email</Label>
        <Input
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
        />

        <Label>Username</Label>
        <Input
          name="userName"
          placeholder="Enter username"
          value={form.userName}
          onChange={handleChange}
        />

        <Label>Password</Label>
        <Input
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        <Label>Confirm Password</Label>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <NoteBox>
          為確保「原創性」證明，請至少填寫一個社群/電商帳號。
        </NoteBox>
        {showPlatformAlert && (
          <AlertBox>尚未填寫任何平台帳號</AlertBox>
        )}

        <Label>IG</Label>
        <Input name="IG" onChange={handleChange}/>
        <Label>FB</Label>
        <Input name="FB" onChange={handleChange}/>
        <Label>YouTube</Label>
        <Input name="YouTube" onChange={handleChange}/>
        <Label>TikTok</Label>
        <Input name="TikTok" onChange={handleChange}/>
        <Label>Shopee</Label>
        <Input name="Shopee" onChange={handleChange}/>
        <Label>Ruten</Label>
        <Input name="Ruten" onChange={handleChange}/>
        <Label>Yahoo</Label>
        <Input name="Yahoo" onChange={handleChange}/>
        <Label>Amazon</Label>
        <Input name="Amazon" onChange={handleChange}/>
        <Label>eBay</Label>
        <Input name="eBay" onChange={handleChange}/>
        <Label>Taobao</Label>
        <Input name="Taobao" onChange={handleChange}/>

        <Button type="submit">註冊 / Register</Button>
        <SwitchText>
          已有帳號？
          <Link to="/login" style={{ color:'#FFD700' }}>
            登入 / Login
          </Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

/* styled-components... (略) */

### (3) `frontend/src/pages/Login.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setErrMsg('');

    if (!identifier.trim() || !password) {
      return setErrMsg('請輸入帳號(Email或UserName) + 密碼');
    }

    let payload;
    if (identifier.includes('@')) {
      payload = { email: identifier.trim().toLowerCase(), password };
    } else {
      payload = { userName: identifier.trim(), password };
    }

    try {
      const resp = await fetch('/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || '登入失敗');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      alert('登入成功');
      navigate('/');
    } catch (err) {
      setErrMsg(err.message);
    }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>登入 / Login</Title>
        {errMsg && <ErrorText>{errMsg}</ErrorText>}

        <Label>帳號 (Email 或 UserName)</Label>
        <Input
          placeholder="example@mail.com 或 userName"
          value={identifier}
          onChange={e=>setIdentifier(e.target.value)}
        />

        <Label>密碼</Label>
        <Input
          type="password"
          placeholder="請輸入密碼"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <Button type="submit">登入 / Login</Button>
        <SwitchText>
          尚未註冊？
          <Link to="/register" style={{ color:'#FFD700' }}>註冊 / Register</Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

/* styled-components... (略) */

### (4) `frontend/src/pages/UploadPage.jsx`

```jsx
import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');

  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div style={{ textAlign:'center', color:'#fff', marginTop:'2rem' }}>
        <h2>尚未登入</h2>
        <p>請先登入後再使用</p>
      </div>
    );
  }

  const doUpload = async() => {
    if (!file) {
      alert('尚未選擇檔案');
      return;
    }
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const resp = await fetch('/upload', {
        method:'POST',
        headers:{ 'Authorization':'Bearer ' + token },
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || data.message || '上傳失敗');
      }
      setMsg(`上傳成功: fingerprint=${data.fingerprint}, ipfsHash=${data.ipfsHash || '無'}, txHash=${data.txHash || '無'}`);
    } catch(e){
      setMsg(`上傳錯誤: ${e.message}`);
    }
  };

  return (
    <div style={{ padding:'2rem', color:'#fff' }}>
      <h2>上傳檔案 (影片 / 圖片)</h2>
      <div style={{ marginBottom:'1rem' }}>
        <label>作品標題: </label>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          style={{ marginLeft:'8px', padding:'6px' }}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>選擇檔案: </label>
        <input
          type="file"
          onChange={e=> setFile(e.target.files[0])}
        />
      </div>
      <button onClick={doUpload} style={{
        backgroundColor:'#ff1c1c',
        color:'#fff',
        padding:'0.5rem 1rem',
        border:'none',
        borderRadius:'4px'
      }}>上傳</button>
      {msg && <p style={{ marginTop:'1rem', color:'yellow' }}>{msg}</p>}
    </div>
  );
}
