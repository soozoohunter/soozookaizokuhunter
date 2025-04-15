import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !userName || !password || !confirmPassword || !role) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    const newUserData = { email, userName, password, role };

    try {
      setLoading(true);
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });

      if (res.ok) {
        alert('註冊成功，請登入');
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.message || '註冊失敗，請重試');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={styles.container}>
      <h2 style={styles.title}>會員註冊</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        {['email', 'userName', 'password', 'confirmPassword'].map((field, idx) => (
          <input key={idx} type={field.includes('password') ? 'password' : field} placeholder={field} value={eval(field)} onChange={(e) => eval('set' + field.charAt(0).toUpperCase() + field.slice(1))(e.target.value)} required style={styles.input} />
        ))}
        <input type="text" placeholder="role" value={role} onChange={(e) => setRole(e.target.value)} required style={styles.input} />
        <button type="submit" disabled={loading} style={styles.button}>{loading ? '註冊中...' : '註冊'}</button>
        <div style={styles.linkContainer}>已有帳號？<Link to="/login" style={styles.link}>立即登入</Link></div>
      </form>
    </div>
  );
}

export default Register;
