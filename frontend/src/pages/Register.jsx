// frontend/src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    role: '',
    serialNumber: '',
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 簡單驗證
    if (!form.email || !form.userName || !form.password || !form.confirmPassword) {
      setError('請填寫必填欄位 / Required fields missing');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('兩次密碼不一致 / Passwords do not match');
      return;
    }

    try {
      // 準備要送給後端的資料
      const body = {
        email: form.email,
        userName: form.userName,
        password: form.password,
        role: form.role || 'copyright',
        serialNumber: form.serialNumber || '',

        // 社群/電商平台 (可至少填一項)
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
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
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
      console.error('Register error:', err);
      setError('發生錯誤，請稍後再試 / An error occurred, please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>會員註冊 / Membership Registration</h2>

        {/* Email */}
        <div style={styles.formGroup}>
          <label style={styles.label}>電子郵件 (Email):</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="example@mail.com"
          />
        </div>

        {/* userName */}
        <div style={styles.formGroup}>
          <label style={styles.label}>用戶名稱 (Username):</label>
          <input
            type="text"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="作為登入帳號 / For login usage"
          />
        </div>

        {/* password */}
        <div style={styles.formGroup}>
          <label style={styles.label}>密碼 (Password):</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="請輸入密碼 / Enter password"
          />
        </div>

        {/* confirmPassword */}
        <div style={styles.formGroup}>
          <label style={styles.label}>確認密碼 (Confirm Password):</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="再次輸入密碼 / Confirm password"
          />
        </div>

        {/* role */}
        <div style={styles.formGroup}>
          <label style={styles.label}>角色 (Role):</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">-- 選擇角色 / Choose Role --</option>
            <option value="copyright">著作權 (Copyright)</option>
            <option value="trademark">商標 (Trademark)</option>
            <option value="both">兩者皆需 (Both)</option>
          </select>
        </div>

        {/* serialNumber (選填) */}
        <div style={styles.formGroup}>
          <label style={styles.label}>序號 (Serial Number):</label>
          <input
            type="text"
            name="serialNumber"
            value={form.serialNumber}
            onChange={handleChange}
            style={styles.input}
            placeholder="(可選) 您的序號 / Optional"
          />
        </div>

        <h3 style={styles.subSectionTitle}>
          社群/電商平台帳號綁定 (Social/E-Commerce Binding)
        </h3>
        <p style={styles.hint}>
          * 請填寫您在各平台的帳號名稱 (至少一項)  
          * Please provide your account names on social/e-commerce platforms (at least one)
        </p>

        {/* ig */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Instagram 帳號 (IG):</label>
          <input
            type="text"
            name="ig"
            value={form.ig}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* fb */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Facebook 帳號 (FB):</label>
          <input
            type="text"
            name="fb"
            value={form.fb}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* youtube */}
        <div style={styles.formGroup}>
          <label style={styles.label}>YouTube 頻道 (YouTube):</label>
          <input
            type="text"
            name="youtube"
            value={form.youtube}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* tiktok */}
        <div style={styles.formGroup}>
          <label style={styles.label}>TikTok 帳號:</label>
          <input
            type="text"
            name="tiktok"
            value={form.tiktok}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* shopee */}
        <div style={styles.formGroup}>
          <label style={styles.label}>蝦皮賣場 (Shopee):</label>
          <input
            type="text"
            name="shopee"
            value={form.shopee}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* ruten */}
        <div style={styles.formGroup}>
          <label style={styles.label}>露天拍賣 (Ruten):</label>
          <input
            type="text"
            name="ruten"
            value={form.ruten}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* yahoo */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Yahoo奇摩拍賣:</label>
          <input
            type="text"
            name="yahoo"
            value={form.yahoo}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* amazon */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Amazon 賣家帳號:</label>
          <input
            type="text"
            name="amazon"
            value={form.amazon}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* ebay */}
        <div style={styles.formGroup}>
          <label style={styles.label}>eBay 帳號:</label>
          <input
            type="text"
            name="ebay"
            value={form.ebay}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* taobao */}
        <div style={styles.formGroup}>
          <label style={styles.label}>淘寶 (Taobao) 帳號:</label>
          <input
            type="text"
            name="taobao"
            value={form.taobao}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        {/* Error Message */}
        {error && <p style={styles.errorMsg}>{error}</p>}

        {/* Submit Button */}
        <button type="submit" style={styles.submitBtn}>
          提交註冊 / Register Now
        </button>

        <p style={styles.note}>
          註冊時綁定您的社群/電商帳號，可有效證明內容原創性，並作為後續侵權偵測依據。<br/>
          Binding your social/e-commerce accounts at registration can effectively prove originality 
          and serve as evidence for future infringement detection.
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '90vh',
    backgroundColor: '#000'
  },
  form: {
    border: '2px solid orange',
    borderRadius: '10px',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '480px',
    width: '100%',
    backgroundColor: 'rgba(255,140,0,0.1)'
  },
  title: {
    color: 'orange',
    marginBottom: '1.5rem',
    fontSize: '1.6rem'
  },
  formGroup: {
    marginBottom: '1rem',
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '0.3rem',
    color: '#FFD700', // 黃金色，與橘色區分
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  subSectionTitle: {
    margin: '1.5rem 0 0.5rem 0',
    color: 'orange',
    fontSize: '1.1rem',
    borderBottom: '1px solid orange',
    textAlign: 'center'
  },
  hint: {
    color: '#ccc',
    fontSize: '0.85rem',
    marginBottom: '1rem'
  },
  errorMsg: {
    color: 'red',
    marginTop: '0.5rem',
    marginBottom: '1rem'
  },
  submitBtn: {
    backgroundColor: 'orange',
    color: '#000',
    padding: '0.6rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%'
  },
  note: {
    color: '#ccc',
    fontSize: '0.85rem',
    marginTop: '1rem',
    lineHeight: '1.4'
  }
};
