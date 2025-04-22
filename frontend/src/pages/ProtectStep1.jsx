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

    // TODO: 在這裡串接後端 API (若有)
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('realName', realName);
    // formData.append('phone', phone);
    // formData.append('address', address);
    // formData.append('email', email);
    // await fetch('/api/protect/step1', { method:'POST', body: formData });

    navigate('/protect/step2');
  };

  return (
    <div style={{ color:'#fff', padding:'2rem', maxWidth:'600px', margin:'0 auto' }}>
      <h2 style={{ color:'#ff6f00' }}>Step 1: Upload & Info</h2>

      {/* ★★★ 新增中英文說明，強調為何要蒐集個資 ★★★ */}
      <p style={{ marginBottom:'1.5rem', lineHeight:'1.6', fontSize:'0.95rem' }}>
        【繁中】為了產出您的<strong>原創著作證明書</strong>、確立
        <strong>著作權保護</strong>，並能在必要時提起法律行動，
        我們必須請您填寫真實姓名、聯絡方式與Email。
        這些資料將用於確認您的身分與作品所有權，確保一旦產生證明文件，
        能真正證明「您」是該作品的原創人。<br/><br/>
        <strong>【EN】</strong> To generate your <em>Originality Certificate</em> and establish 
        genuine copyright protection, we need your real name, contact info, and email.
        This information confirms your identity and ownership of the uploaded work,
        ensuring the legal authenticity of any issued certificate.
      </p>

      <div style={{ marginBottom:'1rem' }}>
        <label>上傳作品檔案 (Upload your work):</label><br/>
        <input type="file" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label>真實姓名 (Real Name):</label><br/>
        <input
          style={styles.input}
          value={realName}
          onChange={e=>setRealName(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>電話 (Phone):</label><br/>
        <input
          style={styles.input}
          value={phone}
          onChange={e=>setPhone(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label>地址 (Address):</label><br/>
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

      {error && (
        <p style={{ color:'red', marginTop:'0.5rem' }}>
          {error}
        </p>
      )}

      <button style={styles.btn} onClick={handleNext}>Next</button>
    </div>
  );
}

const styles = {
  input: {
    width:'100%',
    maxWidth:'300px',
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
