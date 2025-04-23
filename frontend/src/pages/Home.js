// frontend/src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* ===== Banner / Hero 區域 ===== */}
      <div style={styles.banner}>
        {/* === 1) 主標 + 副標各自一行 === */}
        <h1 style={styles.shortTitle}>BLOCKCHAIN-CERTIFIED COPYRIGHT PLATFORM</h1>
        <p style={styles.subTitle}>ONE CLICK TO PROVE YOUR CREATIVE OWNERSHIP.</p>
        
        {/* 2) 既有段落介紹 */}
        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to safeguarding creators worldwide.
          <br /><br />
          Are you still risking losing your intellectual property due to inadequate proof of originality?
          Under international copyright law, failing to prove originality means losing your rights entirely—
          regardless of your creativity.
          <br /><br />
          <strong>ONLY WE</strong> offer a solution powerful enough to end this nightmare instantly:
          <strong> Blockchain Digital Fingerprint</strong> combined with 
          <strong> AI Infringement Detection</strong> and rapid global legal actions.
          <br /><br />
          <strong>Proving originality is notoriously challenging — but not anymore.</strong>
          We simplify complex copyright evidence into a single click. 
          Connect your accounts, and the blockchain instantly becomes your undeniable proof of originality—
          100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>

        {/* 3) 主要行動按鈕：前往 Pricing */}
        <button
          onClick={() => window.location.href = '/pricing'}
          style={styles.enterBtn}
        >
          Get Protected Now / 立即保護你的著作
        </button>

        {/* 4) 次要行動按鈕：前往 Protect Step1 */}
        <button
          onClick={() => window.location.href = '/protect/step1'}
          style={{ ...styles.enterBtn, marginLeft: '1rem' }}
        >
          PROTECT NOW
        </button>

        {/* 5) 公司資訊（英文公司名） */}
        <div style={styles.companyInfo}>
          <hr style={styles.divider} />
          <p style={styles.companyText}>
            <strong>Epic Global International Co., Ltd.</strong><br />
            🇹🇼凱盾全球國際股份有限公司<br /><br />
            <strong>Headquarters:</strong> 1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br />
            <strong>Taipei Office:</strong> No. 3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br />
            <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
          </p>
        </div>
      </div>

      {/* ===== 其他行銷文案 / Supplement 區域 ===== */}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor: 'pointer', color: '#FF5722', marginBottom: '1rem' }}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，<strong>著作權保護</strong>與
              <strong>著作權原創證明</strong>至關重要，特別是在無強制登記制度下，創作者必須自行舉證
              著作權之原創性與完成時間。無法有效舉證，則在法律訴訟中幾乎必敗。
            </p>
            <p>
              我們的平台提供全球獨一無二的解決方案，以區塊鏈技術創建永久不可篡改之證據，
              結合強力AI偵測侵權。只需點擊幾下，即可完成原創認證與著作權保護，讓您在全球法庭上
              都能取得壓倒性證明效力。
            </p>
            <p style={{ marginTop: '1rem' }}>
              <strong>【EN】</strong>
              Under both Taiwanese and international copyright laws,
              the burden of proof for originality lies with creators—
              no mandatory registration is required, but failure to prove authorship
              usually results in losing the case. We are the ONLY platform that integrates
              blockchain immutability and powerful AI infringement detection.
              A few clicks is all it takes to secure your unstoppable legal advantage
              in courts worldwide.
            </p>
            <p style={{ marginTop: '1rem', color: '#ffd54f', fontWeight: '600' }}>
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

/** ========== Styles ========== */
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
  // ★ 主標與副標分行顯示
  shortTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#FF5722',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
  },
  subTitle: {
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    color: '#ffd700', // 金色，可自行調整
    marginBottom: '1.5rem'
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
