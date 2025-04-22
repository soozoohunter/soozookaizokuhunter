// frontend/src/pages/ProtectStep2.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep2() {
  const navigate = useNavigate();
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // 模擬 3 秒生成Hash
    let current = 0;
    const timer = setInterval(() => {
      current += 5;
      if (current >= 100) {
        current = 100;
        setPercent(100);
        setDone(true);
        clearInterval(timer);
      } else {
        setPercent(current);
      }
    }, 150); // 3秒 => 100/5 * 150ms = 3000ms

    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    navigate('/protect/step3');
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 2: Generating Hash...</h2>
      
      {!done && (
        <>
          <div style={styles.spinner} />
          <div style={styles.progressBarContainer}>
            <div style={{ 
              ...styles.progressBarFill, 
              width: `${percent}%` 
            }} />
          </div>
          <p style={{ marginTop:'1rem' }}>{percent}%</p>
          <p style={{ color:'#aaa', marginTop:'0.5rem' }}>
            正在上傳至區塊鏈中，請稍候...
          </p>
        </>
      )}

      {done && (
        <div style={{ marginTop:'1.5rem' }}>
          <p style={{ color:'#FFD700', fontWeight:'bold' }}>
            恭喜！雜湊值生成成功
          </p>
          <p>你的作品已在區塊鏈留下不可逆的原創證明。</p>
          <button style={styles.btn} onClick={handleNext}>Next</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  spinner: {
    margin:'1rem auto',
    width:'40px',
    height:'40px',
    border:'6px solid #444',
    borderTop:'6px solid #ff6f00',
    borderRadius:'50%',
    animation:'spin 0.8s linear infinite'
  },
  progressBarContainer: {
    margin:'1rem auto',
    width:'200px',
    height:'10px',
    background:'#333',
    borderRadius:'5px',
    overflow:'hidden'
  },
  progressBarFill: {
    height:'100%',
    background:'#ff6f00',
    transition:'width 0.1s linear'
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
