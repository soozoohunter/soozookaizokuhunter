import React from 'react';

export default function Pricing() {
  const handleContactUs = ()=>{
    // 先簡單跳轉
    window.location.href = '/contact-us';
  };
  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>Pricing</h2>
      <div style={{ border:'1px solid #f00', padding:'1rem', marginBottom:'1rem' }}>
        <h3>Upgrade Plan</h3>
        <p>暫不開放點選</p>
      </div>
      <div style={{ border:'1px solid #f00', padding:'1rem', marginBottom:'1rem' }}>
        <h3>Pro Plan</h3>
        <p>暫不開放點選</p>
      </div>
      <div style={{ border:'1px solid #f00', padding:'1rem', marginBottom:'1rem' }}>
        <h3>Enterprise Plan</h3>
        <p>暫不開放點選</p>
      </div>
      <div style={{ textAlign:'center', marginTop:'20px' }}>
        <button 
          onClick={handleContactUs}
          style={{
            padding:'10px 20px',
            backgroundColor:'orange',
            border:'none',
            borderRadius:'4px',
            color:'#fff',
            cursor:'pointer'
          }}
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}
