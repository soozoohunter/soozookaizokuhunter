import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TryProtect() {
  const navigate = useNavigate();

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h1 style={{ color:'#ff6f00' }}>Try SUZOO IP Guard / 免費體驗</h1>
      <p>Protect your content with blockchain & AI. No account needed!</p>
      <button
        style={{
          background:'#ff6f00',
          color:'#fff',
          border:'none',
          borderRadius:'6px',
          padding:'1rem 2rem',
          cursor:'pointer'
        }}
        onClick={()=>navigate('/try-protect/details')}
      >
        Start Free Trial
      </button>
    </div>
  );
}
