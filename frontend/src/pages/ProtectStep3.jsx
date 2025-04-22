// frontend/src/pages/ProtectStep3.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectStep3() {
  const navigate = useNavigate();

  const handleInfringement = () => {
    navigate('/protect/step4-infringement');
  };

  const handleCertificate = () => {
    navigate('/payment?item=certificate&price=99');
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 3: Next Action</h2>
      <p>區塊鏈原創紀錄完成，請選擇下一步：</p>

      <div style={{ marginTop:'2rem' }}>
        <button style={styles.btn} onClick={handleInfringement}>
          進行侵權偵測
        </button>

        <button style={{ ...styles.btn, marginLeft:'2rem' }} onClick={handleCertificate}>
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
    cursor:'pointer'
  }
};
