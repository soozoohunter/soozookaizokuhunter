// frontend/src/pages/ProtectStep1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep1() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
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

  const handleNext = async () => {
    if (!file) {
      setError('請上傳檔案');
      return;
    }
    if (!realName.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setError('真實姓名/電話/地址/Email 為必填');
      return;
    }
    setError('');

    // TODO: 在這裡串接後端 API
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('realName', realName);
    // formData.append('phone', phone);
    // ...
    // await fetch('/api/protect/step1', { method:'POST', body: formData });

    navigate('/protect/step2');
  };

  return (
    <div style={{ color:'#fff', padding:'2rem' }}>
      <h2 style={{ color:'#ff6f00' }}>Step 1: Upload & Info</h2>
      <div style={{ marginBottom:'1rem' }}>
        <label>上傳作品檔案:</label><br/>
        <input type="file" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label>真實姓名:</label><br/>
        <input
          style={styles.input}
          value={realName}
          onChange={e=>setRealName(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>電話:</label><br/>
        <input
          style={styles.input}
          value={phone}
          onChange={e=>setPhone(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>地址:</label><br/>
        <input
          style={styles.input}
          value={address}
          onChange={e=>setAddress(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>Email:</label><br/>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
      </div>

      {error && <p style={{ color:'red' }}>{error}</p>}

      <button style={styles.btn} onClick={handleNext}>Next</button>
    </div>
  );
}

const styles = {
  input: {
    width:'280px',
    margin:'0.5rem 0',
    padding:'0.5rem'
  },
  btn: {
    marginTop:'1rem',
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    padding:'0.6rem 1.2rem',
    cursor:'pointer'
  }
};
