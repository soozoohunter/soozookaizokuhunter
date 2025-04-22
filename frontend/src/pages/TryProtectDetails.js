import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TryProtectDetails() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!title.trim()){
      alert("Please enter content title");
      return;
    }
    // 假設要購買 certificate => 99
    navigate(`/payment?item=download_certificate&price=99`);
  };

  return (
    <div style={{ color:'#fff', padding:'2rem' }}>
      <h2>Step 1: Content Info</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            style={{ marginLeft:'0.5rem' }}
          />
        </label>
        <button
          type="submit"
          style={{
            marginLeft:'1rem',
            background:'#ff6f00',
            color:'#fff',
            border:'none',
            borderRadius:'4px',
            padding:'0.5rem 1rem'
          }}
        >
          Next
        </button>
      </form>
    </div>
  );
}
