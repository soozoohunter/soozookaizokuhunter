// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [shopee, setShopee] = useState('');
  const [ruten, setRuten] = useState('');
  const [amazon, setAmazon] = useState('');
  const [taobao, setTaobao] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  async function doRegister() {
    setErrMsg('');
    setOkMsg('');
    if (!email || !password || !userName) {
      setErrMsg('請填寫必填欄位：Email, Password, UserName');
      return;
    }

    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          userName,
          facebook,
          instagram,
          youtube,
          tiktok,
          shopee,
          ruten,
          amazon,
          taobao
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setOkMsg('註冊成功，請前往信箱收驗證碼 -> /auth/verifyEmail');
      } else {
        setErrMsg(data.error || '註冊失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤: ' + e.message);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>會員註冊</h2>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Email (必填)</label>
        <input
          type="text" // 避免 iPad "pattern mismatch"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Password (必填)</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>UserName (必填)</label>
        <input
          type="text"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* ---- 社群 / 電商平台 (選填) ---- */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Facebook</label>
        <input
          type="text"
          value={facebook}
          onChange={e => setFacebook(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Instagram</label>
        <input
          type="text"
          value={instagram}
          onChange={e => setInstagram(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>YouTube</label>
        <input
          type="text"
          value={youtube}
          onChange={e => setYoutube(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>TikTok</label>
        <input
          type="text"
          value={tiktok}
          onChange={e => setTiktok(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>蝦皮 / Shopee</label>
        <input
          type="text"
          value={shopee}
          onChange={e => setShopee(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>露天 / Ruten</label>
        <input
          type="text"
          value={ruten}
          onChange={e => setRuten(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Amazon</label>
        <input
          type="text"
          value={amazon}
          onChange={e => setAmazon(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>淘寶 / Taobao</label>
        <input
          type="text"
          value={taobao}
          onChange={e => setTaobao(e.target.value)}
          style={styles.input}
        />
      </div>

      {errMsg && <p style={{ color: 'red' }}>{errMsg}</p>}
      {okMsg && <p style={{ color: 'lime' }}>{okMsg}</p>}

      <button onClick={doRegister} style={styles.button}>提交註冊</button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '2rem auto',
    padding: '1rem',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#fff',
    borderRadius: '8px'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: 'orange'
  },
  formGroup: {
    marginBottom: '0.8rem'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    color: '#ff1c1c'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    padding: '0.6rem 1.2rem',
    border: 'none',
    background: 'orange',
    color: '#000',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
