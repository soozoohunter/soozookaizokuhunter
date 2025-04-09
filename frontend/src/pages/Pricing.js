// frontend/src/pages/Pricing.jsx
import React from 'react';

export default function Pricing() {

  async function upgradePlan(planName) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('請先登入');
      return;
    }
    try {
      const resp = await fetch('/api/subscribe/upgradePlan', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ plan: planName })
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert('升級失敗: ' + (data.error || '未知錯誤'));
        return;
      }
      alert(data.message || `已升級為 ${data.plan}`);
    } catch (err) {
      alert('升級時發生錯誤:' + err.message);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>方案定價 (Pricing)</h2>

      <div style={styles.planGrid}>
        {/* Free */}
        <div style={styles.planCard}>
          <h3>Free Plan</h3>
          <p>NT$0 / month</p>
          <button onClick={()=>upgradePlan('free')}>切換 Free</button>
        </div>

        {/* Advanced */}
        <div style={styles.planCard}>
          <h3>Advanced Plan</h3>
          <p>NT$600 / month</p>
          <button onClick={()=>upgradePlan('advanced')}>升級 Advanced</button>
        </div>

        {/* Pro */}
        <div style={styles.planCard}>
          <h3>Pro Plan</h3>
          <p>NT$1500 / month</p>
          <button onClick={()=>upgradePlan('pro')}>升級 Pro</button>
        </div>

        {/* Enterprise */}
        <div style={styles.planCard}>
          <h3>Enterprise Plan</h3>
          <p>NT$9000 / month</p>
          <button onClick={()=>upgradePlan('enterprise')}>升級 Enterprise</button>
        </div>
      </div>

      {/* 訴訟服務區塊... */}
      <div style={styles.lawsuit}>
        <h4>訴訟服務</h4>
        <p>NT$9000 / 件，勝訴後平台抽 20%</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '960px',
    margin:'2rem auto',
    color:'#fff'
  },
  title: {
    textAlign:'center',
    marginBottom:'1rem'
  },
  planGrid: {
    display:'flex',
    gap:'1rem',
    flexWrap:'wrap',
    justifyContent:'center'
  },
  planCard: {
    border:'1px solid #555',
    borderRadius:'6px',
    padding:'1rem',
    minWidth:'200px'
  },
  lawsuit: {
    marginTop:'2rem',
    padding:'1rem',
    border:'1px dashed #777'
  }
};
