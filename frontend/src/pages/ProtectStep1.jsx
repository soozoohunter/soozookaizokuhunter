// frontend/src/pages/ProtectStep1.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep1() {
  const navigate = useNavigate();
  // 檔案
  const [file, setFile] = useState(null);
  // 基本人資訊
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleNext = () => {
    // 基本檢查
    if (!file) {
      setError('請上傳檔案');
      return;
    }
    if (!realName.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setError('真實姓名/電話/地址/Email 為必填');
      return;
    }
    setError('');

    // TODO: 您可在此呼叫後端 API, 上傳檔案 + 使用者資訊, 先暫存
    // e.g. const formData = new FormData(); ... fetch('/api/protect/step1', ...)

    // 成功後跳 Step2
    navigate('/protect/step2');
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color:'#ff6f00' }}>Step 1: Upload & User Info</h2>

      <div style={{ marginBottom:'1rem' }}>
        <label>上傳您的作品檔案:</label><br/>
        <input type="file" onChange={handleFileChange} style={{ color:'#fff' }}/>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label>真實姓名:</label><br/>
        <input
          style={styles.input}
          value={realName}
          onChange={e => setRealName(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>電話:</label><br/>
        <input
          style={styles.input}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>地址:</label><br/>
        <input
          style={styles.input}
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>Email:</label><br/>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      {error && <p style={{ color:'red' }}>{error}</p>}

      <button style={styles.btn} onClick={handleNext}>Next</button>
    </div>
  );
}

const styles = {
  container: {
    color:'#fff', padding:'2rem'
  },
  input: {
    width:'300px',
    padding:'0.5rem',
    marginTop:'0.25rem',
    marginBottom:'0.5rem'
  },
  btn: {
    marginTop:'1rem',
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    padding:'0.75rem 1.5rem',
    cursor:'pointer'
  }
};
