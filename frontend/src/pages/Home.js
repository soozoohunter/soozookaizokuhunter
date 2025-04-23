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

        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          Get Protected Now / 立即保護你的著作
        </button>

        {/* ★PROTECT NOW 按鈕*/}
        <button
          onClick={() => window.location.href='/protect/step1'}
          style={{
            ...styles.enterBtn,
            marginLeft: '1rem',
            backgroundColor: '#FF5722'
          }}
        >
           PROTECT NOW
        </button>

        <div style={styles.companyInfo}>
          <hr style={styles.divider}/>
          <p style={styles.companyText}>
            <strong>Epic Global International Co., Ltd.</strong><br/>
            凱盾全球國際股份有限公司<br/><br/>
            <strong>Headquarters:</strong> 1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br/>
            <strong>Taipei Office:</strong> No. 3, Lane 36, Lane 153, Section 2, Sanmin Road, Banqiao, New Taipei City<br/>
            <strong>Contact:</strong> +886 900-296-168 GM Zack Yao
          </p>
        </div>
      </div>

      {/* New content section with aggressive marketing */}
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
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  // 1) Top section
  topSection: {
    padding: '3rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #12181f 0%, #1e1e1e 100%)',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
    margin: '2rem',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1.5rem'
  },
  desc: {
    fontSize: '1rem',
    color: '#c7d2da',
    lineHeight: 1.7,
    marginBottom: '2rem'
  },

  // 上傳 + 按鈕 (直向)
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  uploadLabel: {
    display: 'inline-block',
    backgroundColor: '#1e1e1e',
    padding: '0.6rem 1rem',
    marginBottom: '1rem',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  fileInput: {
    display: 'none'
  },
  uploadText: {
    color: '#ccc'
  },
  actionButton: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    padding: '0.7rem 1.4rem',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Secure Your IP Now 小標 + 說明
  subHeading: {
    fontSize: '1.4rem',
    color: '#FF5722',
    margin: '2rem 0 0.5rem'
  },
  subDesc: {
    color: '#ccc',
    lineHeight: 1.6,
    marginBottom: '1rem'
  },
  viewPlansButton: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    border: 'none',
    padding: '0.7rem 1.4rem',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },

  // 2) Marketing / Explanation
  marketingSection: {
    backgroundColor: '#0f131a',
    padding: '2rem',
    margin: '0 2rem 2rem',
    borderRadius: '10px',
    border: '2px solid #ff6f00',
    textAlign: 'center'
  },
  marketingTitle: {
    fontSize: '1.6rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  marketingDesc: {
    color: '#ccc',
    marginBottom: '1rem',
    lineHeight: 1.6
  },
  legalBlock: {
    marginTop: '1rem',
    textAlign: 'left',
    border: '1px dashed #aaa',
    padding: '1rem',
    borderRadius: '6px',
    backgroundColor: '#161d27'
  },
  legalSummary: {
    color: '#ff9e00',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  legalText: {
    marginTop: '0.5rem',
    color: '#bbb',
    lineHeight: 1.6
  },
  legalEmph: {
    marginTop: '1rem',
    color: '#ffd54f',
    fontWeight: 600
  },

  // 3) Footer
  footer: {
    textAlign: 'center',
    padding: '1rem',
    background: '#181818',
    borderTop: '1px solid #444',
    fontSize: '0.9rem',
    color: '#aaa'
  },
  footerDivider: {
    width: '60%',
    margin: '0.5rem auto',
    borderColor: '#FF5722'
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#b0bec5',
    lineHeight: 1.6,
    marginTop: '0.5rem'
  }
};
