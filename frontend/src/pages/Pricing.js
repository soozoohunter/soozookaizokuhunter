// frontend/src/pages/Pricing.jsx
import React from 'react';

export default function Pricing() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>方案定價 (Pricing)</h2>

      <div style={styles.planGrid}>
        {/* Free Plan */}
        <div style={styles.planCard}>
          <h3 style={styles.planName}>Free Plan</h3>
          <p style={styles.price}>NT$0 / month</p>
          <ul style={styles.ul}>
            <li>短影音上傳 <= 3 部</li>
            <li>圖片上傳 <= 3 張</li>
            <li>AI 偵測 + 區塊鏈存證</li>
            <li>侵權通知 (基本)</li>
          </ul>
        </div>

        {/* Advanced Plan */}
        <div style={styles.planCard}>
          <h3 style={styles.planName}>Advanced Plan</h3>
          <p style={styles.price}>NT$600 / month</p>
          <ul style={styles.ul}>
            <li>短影音上傳 <= 20 部</li>
            <li>圖片上傳 <= 50 張</li>
            <li>AI 偵測 + 區塊鏈存證</li>
            <li>自動 DMCA 申訴</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div style={styles.planCard}>
          <h3 style={styles.planName}>Pro Plan</h3>
          <p style={styles.price}>NT$1500 / month</p>
          <ul style={styles.ul}>
            <li>短影音 & 圖片無上限</li>
            <li>商業品牌偵測</li>
            <li>AI 快速掃描全網</li>
            <li>自動 DMCA + 實名訴訟</li>
          </ul>
        </div>

        {/* Enterprise Plan */}
        <div style={styles.planCard}>
          <h3 style={styles.planName}>Enterprise (企業客戶)</h3>
          <p style={styles.price}>NT$9000 / month</p>
          <ul style={styles.ul}>
            <li>多成員帳號</li>
            <li>API 整合 (批量偵測)</li>
            <li>24小時 VIP客服</li>
            <li>專屬顧問 & 法務</li>
          </ul>
        </div>
      </div>

      {/* 訴訟服務 (可另獨立區塊) */}
      <div style={styles.lawsuitSection}>
        <h3>訴訟服務</h3>
        <p>費用：NT$9000 / 每件</p>
        <p>若贏得賠償，平台抽成 20%</p>
        <p style={{fontSize:'0.9rem', opacity:0.8}}>
          (範例：若勝訴賠償 10 萬，平台抽 2 萬，用戶得 8 萬)
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '960px',
    margin: '2rem auto',
    padding: '1rem',
    color: '#fff'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#ffcc00'
  },
  planGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center'
  },
  planCard: {
    flex: '1 1 200px',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '1rem',
    minWidth: '200px',
    maxWidth: '250px',
    background: 'rgba(0,0,0,0.5)'
  },
  planName: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
    color: '#00ffff'
  },
  price: {
    fontSize: '1.1rem',
    marginBottom: '1rem'
  },
  ul: {
    lineHeight: '1.6',
    paddingLeft: '1.2rem'
  },
  lawsuitSection: {
    marginTop: '2rem',
    padding: '1rem',
    border: '1px dashed #888',
    borderRadius: '4px'
  }
};
