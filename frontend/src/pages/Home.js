// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 檔案選擇 → base64 存 localStorage（步驟1 將會讀取）
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        localStorage.setItem('uploadedFileBase64', evt.target.result);
        localStorage.setItem('uploadedFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // 按鈕 → 前往 /protect/step1
  const handleFreeTrial = () => {
    window.location.href = '/protect/step1';
  };

  // 按鈕 → /pricing
  const handleSubscribe = () => {
    window.location.href = '/pricing';
  };

  return (
    <div style={styles.container}>
      
      {/****************************************************************
       * (A) Hero 區：單欄左對齊
       ****************************************************************/}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>
          BLOCKCHAIN & AI-POWERED ORIGINAL PROOF PLATFORM
        </h1>

        {/* 中文簡介 */}
        <p style={styles.heroParagraph}>
          我們是台灣（🇹🇼）唯一結合區塊鏈與AI的原創證明平台。<br/>
          您是否仍在為證明自己的原創性而苦惱？  
          在國際著作權法下，若無法先行確立原創，  
          您的智慧財產權恐在瞬間喪失。
        </p>

        {/* 英文簡介 */}
        <p style={styles.heroParagraph}>
          We are proudly Taiwanese (🇹🇼), and the only platform combining blockchain and AI
          to prove authorship worldwide.  
          Are you still struggling to prove your <strong>original creation</strong>?  
          Without solid proof, you risk losing your rights entirely—
          <em> no matter how creative you are</em>.
        </p>

        {/* Hero 補充 */}
        <p style={styles.heroNote}>
          By leveraging <strong>Blockchain Digital Fingerprint + AI Infringement Detection</strong>,
          we reduce complex copyright evidence to a single step — 100% tamper-proof, globally recognized,
          and admissible in courts everywhere.
        </p>
      </section>

      {/****************************************************************
       * (B) Upload 區
       *     - 按鈕=Free Trial
       *     - 下方再放簡短敘述
       ****************************************************************/}
      <section style={styles.uploadSection}>
        <div style={styles.uploadRow}>
          <label style={styles.uploadLabel}>
            <span style={{ marginRight:'0.5rem' }}>Upload File:</span>
            <input
              type="file"
              style={styles.fileInput}
              onChange={handleFileChange}
            />
          </label>

          <button style={styles.trialButton} onClick={handleFreeTrial}>
            Free Trial
          </button>
        </div>

        {/* 上傳下方的敘述文字 */}
        <p style={styles.uploadDesc}>
          我們會自動為影音檔產生「動態指紋」、為圖片檔產生「靜態指紋」，  
          讓您的原創作品取得更完善的保護與公信力。
        </p>
      </section>

      {/****************************************************************
       * (C) Marketing + Logo + Subscribe
       ****************************************************************/}
      <section style={styles.marketingSection}>
        {/* 單行：Logo + Welcome */}
        <div style={styles.marketingHeader}>
          <img 
            src="/logo0.jpg" 
            alt="SUZOO Logo" 
            style={styles.logoImg}
          />
          <h2 style={styles.marketingH2}>Welcome to SUZOO IP Guard</h2>
        </div>

        <p style={styles.marketingDesc}>
          Every second counts — someone might be stealing your ideas right now!
          Our mission is to help you secure your creative assets with unstoppable technology
          and a global legal network.
        </p>

        {/* 橘色按鈕 → Pricing */}
        <button style={styles.subscribeBtn} onClick={handleSubscribe}>
          Subscribe / 了解方案
        </button>

        {/* 詳細展開 */}
        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Why "Proof of Originality" Matters (點此展開)
          </summary>
          <div style={styles.expandContent}>
            <p>
              【繁中】根據台灣與國際著作權法，<strong>原創性</strong>必須「具體表達」才受保護。
              若無先行存證，往往在法律爭議中處於被動弱勢。  
              我們使用 <strong>區塊鏈時間戳</strong> + <strong>AI比對</strong>，
              迅速且不可辯駁地證明您的著作權。
            </p>
            <p>
              【EN】Without robust evidence, you risk losing your rights entirely.
              <strong> Blockchain timestamps</strong> plus <strong>AI detection</strong>
              empower you to defend your works across any jurisdiction.
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>法理補充</strong>:  
              1) 著作權法保護表達而非概念；  
              2) 原創性需獨立創作；  
              3) DMCA與全球律師團可急速下架、索賠；  
              4) 區塊鏈+AI讓創作保護前所未有地簡單。
            </p>
            <p style={styles.highlight}>
              Protect your IP once and for all.  
              （現在就加入，為您的創作預先部署最強防護！）
            </p>
          </div>
        </details>
      </section>

      {/****************************************************************
       * (D) Footer
       ****************************************************************/}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>🇹🇼Epic Global International Corporation LTD</strong><br/><br/>
          <strong>Headquarters:</strong> 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          <strong>Banqiao Office:</strong> No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          <strong>Contact:</strong> +886 900-296-168
        </p>
      </footer>
    </div>
  );
}

/** --- Styles --- **/
const styles = {
  container: {
    backgroundColor: '#0a0f17',
    minHeight: '100vh',
    color: '#f5faff',
    display: 'flex',
    flexDirection: 'column'
  },

  /*********************************************************
   * (A) Hero：單欄 + 左對齊
   *********************************************************/
  heroSection: {
    maxWidth: '1100px',
    margin: '2rem auto 0',
    padding: '2rem',
    border: '3px solid #FF5722',
    borderRadius: '12px',
    background: '#12181f',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)'
  },
  heroTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  heroParagraph: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#c7d2da',
    marginBottom: '1rem'
  },
  heroNote: {
    marginTop: '1rem',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#ccc'
  },

  /*********************************************************
   * (B) Upload
   *********************************************************/
  uploadSection: {
    margin: '1.5rem auto 2.5rem',
    maxWidth: '600px',
    textAlign: 'center'
  },
  uploadRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    justifyContent: 'center',
    background: '#161d27',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.5)'
  },
  uploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    background: '#1e1e1e',
    border: '1px solid #444',
    padding: '0.8rem',
    borderRadius: '6px'
  },
  fileInput: {
    width: '220px',
    cursor: 'pointer',
    background: '#fff',
    borderRadius: '4px'
  },
  trialButton: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.65rem 1.2rem',
    cursor: 'pointer'
  },
  uploadDesc: {
    marginTop: '0.8rem',
    fontSize: '0.85rem',
    color: '#ffcc80',
    lineHeight: '1.6'
  },

  /*********************************************************
   * (C) Marketing
   *********************************************************/
  marketingSection: {
    margin: '2rem auto',
    maxWidth: '900px',
    backgroundColor: '#161d27',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },
  marketingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  logoImg: {
    height: '3.5rem'
  },
  marketingH2: {
    color: '#FF5722',
    fontSize: '1.6rem',
    margin: 0
  },
  marketingDesc: {
    fontSize: '1rem',
    color: '#eceff1',
    lineHeight: '1.6',
    marginBottom: '1.5rem'
  },
  subscribeBtn: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.6rem 1.2rem',
    marginBottom: '1.5rem',
    cursor: 'pointer'
  },
  expandBox: {
    textAlign: 'left',
    margin: '1rem auto',
    border: '1px solid #ff6f00',
    borderRadius: '6px',
    padding: '1rem',
    background: '#12181f'
  },
  expandSummary: {
    color: '#ff6f00',
    fontWeight: 600,
    cursor: 'pointer'
  },
  expandContent: {
    marginTop: '0.5rem',
    color: '#ccc',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  },
  highlight: {
    marginTop: '1rem',
    color: '#ffd54f',
    fontWeight: 600
  },

  /*********************************************************
   * (D) Footer
   *********************************************************/
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    padding: '1rem'
  },
  footerDivider: {
    width: '60%',
    margin: '1rem auto',
    borderColor: '#FF5722'
  },
  footerText: {
    fontSize: '0.9rem',
    color: '#b0bec5',
    lineHeight: '1.6'
  }
};
