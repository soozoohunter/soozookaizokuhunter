// frontend/src/pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.banner}>
        <h1 style={styles.shortTitle}>WORLD'S FIRST COPYRIGHT BLOCKCHAIN PLATFORM</h1>
        <p style={styles.subTitle}>PROTECT YOUR CREATIONS WITH ONE CLICK.</p>

        <p style={styles.desc}>
          We're the first and only Taiwanese (台灣) 🇹🇼 platform solving the global copyright puzzle:
          <br /><br />
          Proving originality has always been the toughest part of copyright disputes. 
          Now, with our groundbreaking technology—combining <strong>Blockchain</strong> and <strong>AI Detection</strong>—you'll never again lose your rights due to insufficient evidence.
          <br /><br />
          <strong>One click. Unbreakable proof. Instant global protection.</strong>
        </p>

        <button
          onClick={() => navigate('/pricing')}
          style={styles.enterBtn}
        >
          Get Protected Now / 立即保護你的著作
        </button>

        <button
          onClick={() => navigate('/protect/step1')}
          style={{ ...styles.enterBtn, marginLeft: '1rem' }}
        >
          PROTECT NOW
        </button>

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

      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Don't let copyright infringement steal your success.
          <br />
          Get irrefutable blockchain evidence and AI-powered infringement protection today.
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor: 'pointer', color: '#FF5722', marginBottom: '1rem' }}>
            Why is "Originality" Crucial? 點此展開
          </summary>
          <div style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p>
              【繁中】原創性決定了你的著作能否獲得法律保護。
              台灣及國際著作權法皆強調「獨立完成創作」的重要性，
              但要提出有效證據常是一大難題。<br />
              我們的服務透過區塊鏈技術，在創作完成瞬間即刻上鏈，
              形成全球法庭都無法否認的證據，並搭配AI自動偵測侵權行為，
              讓你的創作從此不再被盜用。
            </p>
            <p style={{ marginTop: '1rem' }}>
              <strong>【EN】</strong>
              Originality is your strongest asset in copyright cases.
              Our blockchain and AI-driven system instantly creates undeniable proof of your work’s originality,
              ensuring you win every copyright dispute.
            </p>
            <p style={{ marginTop: '1rem', color: '#ffd54f', fontWeight: '600' }}>
              Protect your IP today—once it's on the blockchain, it's protected forever.
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>全球唯一！</strong> 區塊鏈＋AI雙重技術，終極解決著作權舉證難題。
          <br />立即行動，讓侵權者無處可逃。
        </p>
      </div>
    </div>
  );
}

/** Styles */
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
  shortTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: '0.5rem'
  },
  subTitle: {
    fontSize: '1.1rem',
    color: '#ffd700',
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
    fontWeight: 'bold'
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
