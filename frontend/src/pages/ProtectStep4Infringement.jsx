// frontend/src/pages/ProtectStep4Infringement.jsx

import React, { useEffect, useState } from 'react';

export default function ProtectStep4Infringement() {
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    let p = 0;
    const timer = setInterval(() => {
      p += 4; // 25 steps => 100
      if (p >= 100) {
        p = 100;
        setPercent(100);
        setDone(true);
        setResultCount(3); // 假裝偵測到3筆
        clearInterval(timer);
      } else {
        setPercent(p);
      }
    }, 120); // 25*120=3000ms

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 4: Infringement Detection</h2>

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
            正在爬蟲中，掃描可能的侵權內容...
          </p>
        </>
      )}

      {done && (
        <div style={{ marginTop:'2rem' }}>
          <p style={{ color:'#ff6f00', fontWeight:'bold' }}>
            偵測完成：發現 {resultCount} 筆疑似侵權
          </p>
          <p style={{ marginTop:'1rem' }}>
            若需查看侵權清單或提告，請付 NT$99 或升級訂閱方案。
          </p>
          <p style={{ marginTop:'1rem', color:'#ccc' }}>
            <strong>單次付費：</strong> 
            <a href="/payment?item=infringement_view&price=99" style={styles.link}>
              立即查看
            </a>
            　|　
            <strong>訂閱：</strong> 
            <a href="/pricing" style={styles.link}>
              前往升級
            </a>
          </p>
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
  link: {
    color:'#ff6f00',
    textDecoration:'none',
    fontWeight:'bold'
  }
};
