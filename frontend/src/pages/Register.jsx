// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    role: '',     // 預設可空或 'copyright'
    ig: '',
    fb: '',
    youtube: '',
    tiktok: '',
    shopee: '',
    ruten: '',
    yahoo: '',
    amazon: '',
    ebay: '',
    taobao: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 檢查必填
    if (!form.email || !form.userName || !form.password || !form.confirmPassword) {
      setError('請填寫必要欄位 / Required fields missing');
      return;
    }
    // 密碼一致性
    if (form.password !== form.confirmPassword) {
      setError('兩次密碼不一致 / Passwords do not match');
      return;
    }

    try {
      // 準備要送給後端的資料（不包含 serialNumber）
      const body = {
        email: form.email,
        userName: form.userName,
        password: form.password,
        role: form.role || 'copyright',
        ig: form.ig,
        fb: form.fb,
        youtube: form.youtube,
        tiktok: form.tiktok,
        shopee: form.shopee,
        ruten: form.ruten,
        yahoo: form.yahoo,
        amazon: form.amazon,
        ebay: form.ebay,
        taobao: form.taobao
      };

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || '註冊失敗 (Register Failed)');
      } else {
        alert('註冊成功，資料已上鏈 / Registration success!');
        navigate('/login');
      }
    } catch (err) {
      console.error('[Register Error]', err);
      setError('發生錯誤，請稍後再試 / An error occurred, please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h2 style={styles.title}>
          會員註冊 / Member Registration <br/>
          <span style={{ fontSize:'0.8rem', color:'#ccc' }}>
            (用戶名稱即為未來登入的帳號 / Your userName will be used for login)
          </span>
        </h2>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label}>電子郵件 (Email):</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              style={styles.input}
              required
            />
          </div>

          {/* UserName */}
          <div style={styles.formGroup}>
            <label style={styles.label}>用戶名稱 (Username):</label>
            <input
              type="text"
              name="userName"
              value={form.userName}
              onChange={handleChange}
              placeholder="此欄位即為未來登入帳號"
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div style={styles.formGroup}>
            <label style={styles.label}>密碼 (Password):</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          {/* Confirm Password */}
          <div style={styles.formGroup}>
            <label style={styles.label}>確認密碼 (Confirm Password):</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          {/* Role */}
          <div style={styles.formGroup}>
            <label style={styles.label}>角色 (Role):</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">-- 選擇 / Choose --</option>
              <option value="copyright">著作權 (Copyright)</option>
              <option value="trademark">商標 (Trademark)</option>
              <option value="both">兩者皆需 (Both)</option>
            </select>
          </div>

          <h3 style={styles.subSection}>
            社群/電商平台帳號綁定 (Social/E-commerce Binding)
          </h3>
          <p style={styles.hint}>
            * 請填寫您在各平台上的帳號名稱 (至少一項)  
            * Provide at least one platform account
          </p>

          {/* IG / FB / YouTube / TikTok / Shopee / Ruten / Yahoo / Amazon / eBay / Taobao */}
          <PlatformInput label="Instagram (IG)" name="ig" value={form.ig} handleChange={handleChange}/>
          <PlatformInput label="Facebook (FB)" name="fb" value={form.fb} handleChange={handleChange}/>
          <PlatformInput label="YouTube"        name="youtube" value={form.youtube} handleChange={handleChange}/>
          <PlatformInput label="TikTok"         name="tiktok" value={form.tiktok} handleChange={handleChange}/>
          <PlatformInput label="蝦皮 (Shopee)"  name="shopee" value={form.shopee} handleChange={handleChange}/>
          <PlatformInput label="露天 (Ruten)"   name="ruten" value={form.ruten} handleChange={handleChange}/>
          <PlatformInput label="Yahoo奇摩"       name="yahoo" value={form.yahoo} handleChange={handleChange}/>
          <PlatformInput label="Amazon"         name="amazon" value={form.amazon} handleChange={handleChange}/>
          <PlatformInput label="eBay"           name="ebay" value={form.ebay} handleChange={handleChange}/>
          <PlatformInput label="淘寶 (Taobao)"  name="taobao" value={form.taobao} handleChange={handleChange}/>

          <button type="submit" style={styles.submitBtn}>
            提交註冊 / Register Now
          </button>

          <p style={styles.note}>
            註冊時綁定社群/電商帳號，可有效證明內容原創，並作為侵權偵測依據。<br/>
            Binding social/e-commerce accounts at registration effectively proves originality 
            and aids future infringement detection.
          </p>
        </form>
      </div>
    </div>
  );
}

/** 可抽出一個簡易平台欄位元件 */
function PlatformInput({ label, name, value, handleChange }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}:</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    minHeight: '100vh',
    margin: 0,
    padding: 0
  },
  formWrapper: {
    border: '2px solid orange',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,140,0,0.1)',
    width: '400px',
    padding: '1.5rem',
    textAlign: 'center'
  },
  title: {
    color: 'orange',
    marginBottom: '1rem',
    fontSize: '1.6rem'
  },
  errorMsg: {
    color: 'red',
    marginBottom: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '0.8rem',
    textAlign: 'left'
  },
  label: {
    color: '#FFD700',
    marginBottom: '0.3rem',
    fontWeight: 'bold',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  subSection: {
    marginTop: '1.2rem',
    marginBottom: '0.5rem',
    color: 'orange',
    borderBottom: '1px solid orange',
    fontSize: '1.1rem'
  },
  hint: {
    color: '#ccc',
    fontSize: '0.85rem',
    marginBottom: '1rem'
  },
  submitBtn: {
    marginTop: '1rem',
    backgroundColor: 'orange',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '0.6rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  note: {
    color: '#ccc',
    fontSize: '0.85rem',
    marginTop: '1rem',
    lineHeight: '1.4'
  }
};
