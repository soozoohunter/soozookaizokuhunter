// frontend/src/pages/Pricing.js
import React from 'react';

export default function PricingPage() {
  const containerStyle = {
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1rem',
    maxWidth: '600px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)'
  };
  const titleStyle = {
    color: 'red',
    marginBottom: '1rem',
    fontSize: '1.8rem'
  };
  const planContainer = {
    display: 'flex',
    justifyContent: 'space-evenly',
    gap:'1rem',
    flexWrap:'wrap'
  };
  const planBox = {
    border:'1px solid #999',
    borderRadius:'6px',
    padding:'1rem',
    minWidth:'160px'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Pricing Plans</h2>
      <p style={{ color:'#fff', marginBottom:'1rem' }}>
        We offer monthly and annual plans for both Copyright and Trademark services.
      </p>

      <div style={planContainer}>
        {/* Basic (monthly) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>BASIC (Monthly)</h3>
          <p style={{ color:'#fff' }}>NT$ 0 / mo (Free)</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Short videos (3 / mo)</li>
            <li>Images (10 / mo)</li>
            <li>Basic DMCA Takedown</li>
            <li>Basic Trademark Check</li>
          </ul>
        </div>

        {/* Basic (annual) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>BASIC (Annual)</h3>
          <p style={{ color:'#fff' }}>NT$ 0 / year</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Same as Basic monthly, but free for a year</li>
          </ul>
        </div>

        {/* PRO (monthly) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>PRO (Monthly)</h3>
          <p style={{ color:'#fff' }}>NT$ 999 / mo</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Short videos (15 / mo)</li>
            <li>Images (30 / mo)</li>
            <li>Standard DMCA + Faster Takedown</li>
            <li>Advanced Trademark Check</li>
          </ul>
        </div>

        {/* PRO (annual) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>PRO (Annual)</h3>
          <p style={{ color:'#fff' }}>NT$ 9990 / year</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Short videos (15 / mo x 12)</li>
            <li>Images (30 / mo x 12)</li>
            <li>Discounted total (save 15%)</li>
          </ul>
        </div>

        {/* ENTERPRISE (monthly) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>ENTERPRISE (Monthly)</h3>
          <p style={{ color:'#fff' }}>NT$ 1999 / mo</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Short videos (30 / mo)</li>
            <li>Images (60 / mo)</li>
            <li>Priority DMCA & Trademark Enforcement</li>
            <li>Dedicated Support</li>
          </ul>
        </div>

        {/* ENTERPRISE (annual) */}
        <div style={planBox}>
          <h3 style={{ color:'orange' }}>ENTERPRISE (Annual)</h3>
          <p style={{ color:'#fff' }}>NT$ 19990 / year</p>
          <ul style={{ textAlign:'left', color:'#ccc' }}>
            <li>Short videos (30 / mo x 12)</li>
            <li>Images (60 / mo x 12)</li>
            <li>Save ~17% vs monthly</li>
            <li>Premium 24/7 Support</li>
          </ul>
        </div>
      </div>

      <hr style={{ margin:'1rem 0', borderColor:'orange' }} />

      <h3 style={{ color:'orange' }}>Trademark & DMCA Solutions</h3>
      <p style={{ color:'#ccc', margin:'0.5rem 0' }}>
        We also offer full-service trademark filing and renewal reminders,  
        plus 24-hour DMCA takedown guarantee to remove infringing content.
      </p>
    </div>
  );
}
