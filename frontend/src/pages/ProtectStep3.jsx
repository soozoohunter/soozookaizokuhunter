// frontend/src/pages/ProtectStep3.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep3() {
  const navigate = useNavigate();

  const handleGoInfringement = () => {
    navigate('/protect/step4-infringement');
  };

  const handleDownloadCert = () => {
    // 如果要99元 => 參數帶 item=certificate
    const paramStr = '?item=certificate&price=99';
    navigate(`/payment${paramStr}`);
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 3: Next Action</h2>
      <p>您已擁有區塊鏈原創紀錄，請選擇下一步：</p>
      <div style={{ margin:'2rem auto' }}>
        <button
          style={styles.btn}
          onClick={handleGoInfringement}
        >
          開始侵權偵測
        </button>

        <button
          style={{ ...styles.btn, marginLeft:'2rem' }}
          onClick={handleDownloadCert}
        >
          下載原創證書 (NT$99)
        </button>
      </div>
    </div>
  );
}

const styles = {
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
