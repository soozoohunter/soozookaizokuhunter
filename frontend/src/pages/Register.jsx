// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('copyright');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !userName || !password || !confirmPassword) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次密碼不一致');
      return;
    }
    try {
      const body = { email, userName, password, confirmPassword, role };
      const res = await fetch('/auth/register', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '註冊失敗');
      } else {
        alert('註冊成功！您目前為 BASIC 方案 (首月免費)');
        navigate('/login');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', marginTop:'2rem' }}>
      <form 
        onSubmit={handleRegister}
        style={{
          textAlign:'center',
          border:'2px solid orange',
          padding:'20px',
          borderRadius:'8px'
        }}
      >
        <h2 style={{ color:'orange', marginBottom:'1rem' }}>註冊</h2>

        {/* Email */}
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', marginBottom:'0.5rem', color:'#fff' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem', border:'1px solid orange' }}
          />
        </div>

        {/* User Name */}
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', marginBottom:'0.5rem', color:'#fff' }}>使用者名稱:</label>
          <input
            type="text"
            value={userName}
            onChange={e=>setUserName(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem', border:'1px solid orange' }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', marginBottom:'0.5rem', color:'#fff' }}>密碼:</label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem', border:'1px solid orange' }}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', marginBottom:'0.5rem', color:'#fff' }}>再次輸入密碼:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e=>setConfirmPassword(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem', border:'1px solid orange' }}
          />
        </div>

        {/* Role */}
        <div style={{ marginBottom:'1rem', color:'#fff', textAlign:'left' }}>
          <label>選擇主要用途 / 角色:</label><br/>
          <label>
            <input
              type="radio"
              name="role"
              value="copyright"
              checked={role === 'copyright'}
              onChange={e=>setRole(e.target.value)}
            />
            著作權(短影音/圖片)
          </label><br/>
          <label>
            <input
              type="radio"
              name="role"
              value="trademark"
              checked={role === 'trademark'}
              onChange={e=>setRole(e.target.value)}
            />
            商標
          </label><br/>
          <label>
            <input
              type="radio"
              name="role"
              value="both"
              checked={role === 'both'}
              onChange={e=>setRole(e.target.value)}
            />
            兩者皆需
          </label>
        </div>

        {/* Error */}
        {error && <p style={{ color:'red', marginBottom:'1rem' }}>{error}</p>}

        {/* Submit */}
        <button 
          type="submit"
          style={{
            padding:'0.5rem 1rem',
            backgroundColor:'orange',
            border:'none',
            color:'#fff',
            cursor:'pointer'
          }}
        >
          立即註冊
        </button>
      </form>
    </div>
  );
}

export default Register;
