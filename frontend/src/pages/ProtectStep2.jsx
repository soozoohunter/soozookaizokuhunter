// frontend/src/pages/ProtectStep2.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep2() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('正在生成區塊鏈Hash...');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // 模擬 2 秒後完成
    const timer = setTimeout(() => {
      setStatus('雜湊值生成成功！');
      setDone(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigate('/protect/step3');
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 2: Generating Hash</h2>
      <p style={{ margin:'1rem' }}>{status}</p>

      {!done && (
        <div style={{ marginTop:'1.5rem' }}>
          <div className="spinner" style={styles.spinner} />
          <p>上傳至區塊鏈中，請稍候...</p>
        </div>
      )}

      {done && (
        <div style={{ marginTop:'1.5rem' }}>
          <p style={{ color:'#FFD700' }}>
            已在區塊鏈中完成原創紀錄！
          </p>
          <button style={styles.btn} onClick={handleNext}>Next</button>
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
    cursor:'pointer'
  }
};
