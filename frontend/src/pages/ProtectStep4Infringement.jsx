// frontend/src/pages/ProtectStep4Infringement.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep4Infringement() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    // 模擬2秒後掃描完畢
    const timer = setTimeout(() => {
      setScanning(false);
      // 假裝掃到 5 筆
      setResultCount(5);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSinglePay = () => {
    // 單次付費
    navigate('/payment?item=infringement_view&price=99');
  };

  const handleSubscription = () => {
    // 若有訂閱方案
    alert('訂閱方案: 每月299，可享無限制侵權偵測 & 檔案上傳');
    // 您可在這裡 navigate('/pricing') 或另做 /subscribe
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 4: Infringement Detection</h2>
      {scanning ? (
        <div style={{ marginTop:'2rem' }}>
          <div className="spinner" style={styles.spinner}/>
          <p>正在進行侵權偵測，請稍候…</p>
        </div>
      ) : (
        <div>
          <p style={{ color:'#ff6f00', fontWeight:'bold' }}>
            偵測完成：發現 {resultCount} 筆疑似侵權。
          </p>
          <p>
            若您想查看詳細侵權清單並提告，請付一次性 NT$99，
            或升級為月訂閱299元方案，享無限制偵測與服務。
          </p>

          <div style={{ marginTop:'2rem' }}>
            <button style={styles.btn} onClick={handleSinglePay}>
              單次付99
            </button>
            <button style={{ ...styles.btn, marginLeft:'2rem' }} onClick={handleSubscription}>
              查看訂閱方案
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  spinner: {
    width:'40px',
    height:'40px',
    border:'6px solid #ccc',
    borderTop:'6px solid #ff6f00',
    borderRadius:'50%',
    animation:'spin 1s linear infinite',
    margin:'0 auto'
  },
  btn: {
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    padding:'0.75rem 1.5rem',
    cursor:'pointer',
    fontSize:'1rem'
  }
};
