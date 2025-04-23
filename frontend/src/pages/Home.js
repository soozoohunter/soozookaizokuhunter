// frontend/src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* 1) Hero banner */}
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>
          THE WORLD'S ONLY Blockchain-Proven Originality Platform
        </h1>
        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to safeguarding creators worldwide.
          <br/><br/>
          Are you still risking losing your intellectual property due to inadequate proof of originality?
          Under international copyright law, failing to prove originality means losing your rights entirely—
          regardless of your creativity.
          <br/><br/>
          <strong>ONLY WE</strong> offer a solution powerful enough to end this nightmare instantly: 
          <strong> Blockchain Digital Fingerprint</strong> combined with 
          <strong> AI Infringement Detection</strong> and rapid global legal actions.
          <br/><br/>
          <strong>Proving originality is notoriously challenging — but not anymore.</strong> 
          We simplify complex copyright evidence into a single click. 
          Connect your accounts, and the blockchain instantly becomes your undeniable proof 
          of originality. 100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>
      </div>

      {/* 2) Secure… section & free upload bar */}
      <div style={styles.secureSection}>
        <h2 style={styles.secureTitle}>
          Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
        </h2>

        {/* ← Single‐row upload bar */}
        <div style={styles.uploadBar}>
          <input 
            type="file" 
            style={styles.fileInput} 
            onChange={e => console.log(e.target.files[0])}
          />
          <button
            style={styles.uploadButton}
            onClick={() => window.location.href = '/protect/step1'}
          >
            Hunter for Free / 免費試用
          </button>
        </div>
      </div>

      {/* 3) Welcome / marketing */}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={styles.legalSummary}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={styles.legalText}>
            {/* … your bilingual legal copy here … */}
            <p>
              【繁中】根據台灣與國際著作權法，<strong>著作權保護</strong>與
              <strong>著作權原創證明</strong>至關重要，特別是在無強制登記制度下，...
            </p>
            <p style={styles.legalEmph}>
              Join us now and defend your creative value like never before!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>我們是世界唯一！</strong> 只有我們能將區塊鏈與
          <strong>著作權原創證明</strong>完美結合...
        </p>
      </div>

      {/* 4) Company info footer */}
      <div style={styles.companyInfo}>
        <hr style={styles.divider} />
        <p style={styles.companyText}>
          <strong>Epic Global International Co., Ltd.</strong><br/>
          凱盾全球國際股份有限公司<br/><br/>
          <strong>Headquarters:</strong> 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          <strong>Banqiao Office:</strong> No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
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
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
    marginBottom: '3rem'
  },
  mainTitle: {
    fontSize: '2.8rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#FF5722'
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.8',
    color: '#c7d2da'
  },

  secureSection: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  secureTitle: {
    fontSize: '1.8rem',
    color: '#FF5722',
    marginBottom: '1rem',
    fontWeight: 600
  },
  uploadBar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1rem'
  },
  fileInput: {
    padding: '0.4rem',
    backgroundColor: '#fff',
    borderRadius: '4px'
  },
  uploadButton: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer'
  },

  addonSection: {
    backgroundColor: '#161d27',
    padding: '2.5rem',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center',
    marginBottom: '3rem'
  },
  welcomeTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  addonDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '1.5rem'
  },
  legalBlock: {
    textAlign: 'left',
    display: 'inline-block',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto 1.5rem',
    background: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    padding: '1rem'
  },
  legalSummary: {
    cursor: 'pointer',
    color: '#FF5722',
    fontWeight: 500
  },
  legalText: {
    marginTop: '1rem',
    lineHeight: 1.6,
    fontSize: '0.95rem',
    color: '#c7d2da'
  },
  legalEmph: {
    marginTop: '1rem',
    color: '#ffd54f',
    fontWeight: 600
  },
  extraMarketing: {
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: 600
  },

  companyInfo: {
    textAlign: 'center',
    marginTop: '4rem'
  },
  divider: {
    width: '60%',
    margin: '1.5rem auto',
    borderColor: '#FF5722'
  },
  companyText: {
    fontSize: '0.95rem',
    color: '#b0bec5',
    lineHeight: 1.6
  }
};
