// frontend/src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* Enhanced banner section */}
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>
          THE WORLD'S ONLY Blockchain-Proven Originality Platform
        </h1>

        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to safeguarding creators worldwide.
          <br/><br/>
          Are you still risking losing your intellectual property due to inadequate proof of originality?
          Under international copyright law, failing to prove originality means losing your rights entirely—
          regardless of your creativity.<br/><br/>
          <strong>ONLY WE</strong> offer a solution powerful enough to end this nightmare instantly:
          <strong> Blockchain Digital Fingerprint</strong> combined with 
          <strong> AI Infringement Detection</strong> and rapid global legal actions.<br/><br/>
          <strong>Proving originality is notoriously challenging — but not anymore.</strong> 
          We simplify complex copyright evidence into a single click. 
          Connect your accounts, and the blockchain instantly becomes your undeniable proof of originality. 
          100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>

        {/* 保留：Get Protected Now 按鈕 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          Get Protected Now / 立即保護你的著作
        </button>

        <div style={styles.companyInfo}>
          <hr style={styles.divider}/>
          <p style={styles.companyText}>
            <strong>🇹🇼Epic Global International Co., Ltd.</strong><br/>
            凱盾全球國際股份有限公司<br/><br/>
            <strong>Headquarters:</strong> 1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br/>
            <strong>Taipei Office:</strong> No. 3, Lane 36, Lane 153, Section 2, Sanmin Road, Banqiao, New Taipei City<br/>
            <strong>Contact:</strong> +886 900-296-168 GM Zack Yao
          </p>
        </div>
      </div>

      {/* ★ 新增的 Hunter for Free 區塊 (Namecheap風格) ★ */}
      <div style={styles.hunterSection}>
        <h2 style={styles.hunterTitle}>
          Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
        </h2>
        <p style={styles.hunterDesc}>
          捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI智慧技術，
          24小時全方位偵測與追蹤侵權行為，為你的影音、圖像、文字與商標提供強力法律證據。<br/>
          現在就免費體驗上傳，立即生成原創證明！
        </p>
        
        {/* 圓角醒目按鈕 → 前往 /protect/step1 */}
        <button
          onClick={() => window.location.href='/protect/step1'}
          style={styles.roundButton}
        >
          Hunter for Free / 免費試用
        </button>
      </div>

      {/* 下方加強行銷區塊 */}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor:'pointer', color:'#FF5722', marginBottom:'1rem' }}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={{ marginTop:'1rem', lineHeight:'1.6', fontSize:'0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，<strong>著作權保護</strong>與
              <strong>著作權原創證明</strong>至關重要，特別是在無強制登記制度下，創作者必須自行舉證
              <strong>著作權</strong>之原創性與完成時間。無法有效舉證，則在法律訴訟中幾乎必敗無疑。
            </p>
            <p>
              我們的平台提供全球獨一無二的解決方案，以區塊鏈技術創建永久不可篡改之證據，結合強力AI偵測侵權。只需點擊幾下，
              即可完成原創認證與<strong>著作權保護</strong>，讓您在全球法庭上都能取得壓倒性證明效力。
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>【EN】</strong>  
              Under both Taiwanese and international copyright laws, the burden of proof for originality lies with creators—
              no mandatory registration is required, but failure to prove authorship usually results in losing the case.  
              We are the ONLY platform that integrates blockchain immutability and powerful AI infringement detection. 
              A few clicks is all it takes to secure your unstoppable legal advantage in courts worldwide.
            </p>
            <p style={{ marginTop:'1rem', color:'#ffd54f', fontWeight:'600' }}>
              Join us now and defend your creative value like never before!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>我們是世界唯一！</strong> 只有我們能將區塊鏈與
          <strong>著作權原創證明</strong>完美結合，並提供即時掃描、
          DMCA強制下架與全球法律行動。別再猶豫，立即行動吧！
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    padding: '4rem',
    fontFamily: 'Inter, sans-serif'
  },
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    padding: '3rem',
    background: '#12181f',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)'
  },
  mainTitle: {
    fontSize: '2.8rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: '#FF5722'
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.9',
    color: '#c7d2da',
    marginBottom: '2rem'
  },
  enterBtn: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'transform 0.2s'
  },
  companyInfo: {
    marginTop: '2.5rem'
  },
  divider: {
    margin: '2rem auto',
    width: '60%',
    border: '1px solid #FF5722'
  },
  companyText: {
    fontSize: '0.95rem',
    color: '#b0bec5',
    lineHeight: '1.7'
  },
  // ★ 新增：Hunter for Free 區塊
  hunterSection: {
    marginTop: '2rem',
    padding: '2rem',
    backgroundColor: '#161d27',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
  },
  hunterTitle: {
    fontSize: '1.8rem',
    color: '#FF5722',
    marginBottom: '1rem',
    fontWeight: '700'
  },
  hunterDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '1.5rem'
  },
  roundButton: {
    backgroundColor: '#e53935', // 可改成更亮或更深的紅橘色
    color: '#fff',
    padding: '0.8rem 2rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '25px', // 顯示更圓
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  addonSection: {
    marginTop: '3rem',
    padding: '3rem',
    backgroundColor: '#161d27',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center'
  },
  welcomeTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1.2rem',
    fontWeight: '700'
  },
  addonDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '2rem'
  },
  legalBlock: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    textAlign: 'left'
  },
  extraMarketing: {
    marginTop: '2rem',
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: '600'
  }
};
