// frontend/src/pages/Pricing.js
import React from 'react';

function Pricing() {
  return (
    <div style={{ padding:'1rem' }}>
      <h2>方案定價 (Pricing)</h2>
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>Free Plan</h3>
          <p>NT$0 / month, up to 3 works</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>Advanced Plan</h3>
          <p>NT$600 / month, up to 20 works</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>Pro Plan</h3>
          <p>NT$1500 / month, unlimited detection</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>Enterprise Plan</h3>
          <p>NT$9000 / month, multi-user & API</p>
        </div>
        <div style={{ border:'1px solid #ccc', padding:'1rem', minWidth:'150px' }}>
          <h3>BigCorp Plan</h3>
          <p>Contact us for custom plan</p>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
