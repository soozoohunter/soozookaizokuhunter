// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 上傳檔案 → base64 存 localStorage 以便 Step1
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

  // 按下 Free Trial → /protect/step1
  const handleFreeTrial = () => {
    window.location.href = '/protect/step1';
  };

  // 按下 Subscribe → /pricing
  const handleSubscribe = () => {
    window.location.href = '/pricing';
  };

  return (
    <div style={styles.container}>
      
      {/*****************************************************************
       * (A) Hero：三欄
       *****************************************************************/}
      <section style={styles.heroSection}>
        <div style={styles.heroRow}>

          {/* 左: 中文 */}
          <div style={styles.heroColLeft}>
            <p style={styles.paragraph}>
              我們是台灣（🇹🇼）唯一結合區塊鏈與AI的原創證明平台。<br/>
              仍在為了證明自己的原創性而苦惱嗎？  
              在國際著作權法下，若無法先行證明原創，  
              您的權利恐在瞬間喪失。
            </p>
          </div>

          {/* 中: 大標題 */}
          <div style={styles.heroColCenter}>
            <h1 style={styles.centerTitle}>
              BLOCKCHAIN & AI-POWERED<br/>
              ORIGINAL PROOF PLATFORM
            </h1>
          </div>

          {/* 右: 英文 */}
          <div style={styles.heroColRight}>
            <p style={styles.paragraph}>
              We are proudly Taiwanese (🇹🇼), the only platform combining blockchain and AI
              to prove authorship worldwide.<br/>
              Still struggling to prove your <strong>original creation</strong>?  
              Without solid proof, you risk losing your rights entirely — 
              <em>no matter how creative you are</em>.
            </p>
          </div>
        </div>

        {/* Hero 下方一行補充 */}
        <p style={styles.heroNote}>
          By leveraging <strong>Blockchain Digital Fingerprint + AI Infringement Detection</strong>,
          we reduce complex copyright evidence to a single step — 100% tamper-proof, globally recognized,
          and admissible in courts everywhere.
        </p>
      </section>

      {/*****************************************************************
       * (B) Upload + Free Trial
       *     - 上方加一句「上傳後會自動生成動/靜態指紋 + 上鏈」說明
       *****************************************************************/}
      <section style={styles.uploadSection}>
        <p style={styles.uploadHint}>
          ※ 上傳後，我們將自動為影音檔生成「動態指紋」、圖片檔生成「靜態指紋」，並上鏈產生雜湊值！
        </p>
        <div style={styles.uploadRow}>
          {/* 中: 檔案上傳 (寬) */}
          <label style={styles.uploadLabel}>
            <span style={{ marginRight:'0.5rem' }}>Upload File:</span>
            <input
              type="file"
              style={styles.fileInput}
              onChange={handleFileChange}
            />
          </label>

          {/* 右: Free Trial */}
          <button style={styles.trialButton} onClick={handleFreeTrial}>
            Free Trial
          </button>
        </div>
      </section>

      {/*****************************************************************
       * (C) 行銷區 + 單行 (Logo + Welcome)
       *****************************************************************/}
      <section style={styles.marketingSection}>
        {/* Logo + "Welcome to SUZOO IP Guard" 同一行 */}
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

        {/* 橘色按鈕 → /pricing */}
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

      {/*****************************************************************
       * (D) Footer
       *****************************************************************/}
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
    backgroundColor:'#0a0f17',
    minHeight:'100vh',
    color:'#f5faff',
    display:'flex',
    flexDirection:'column'
  },

  /************************************************************
   * (A) Hero 3欄
   ************************************************************/
  heroSection: {
    maxWidth:'1200px',
    margin:'2rem auto 0',
    padding:'2rem',
    border:'3px solid #FF5722',
    borderRadius:'12px',
    background:'#12181f',
    boxShadow:'0 8px 24px rgba(255,87,34,0.4)'
  },
  heroRow: {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'start',
    gap:'1rem'
  },
  heroColLeft: {
    flex:'1'
  },
  heroColCenter: {
    flex:'1',
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  },
  heroColRight: {
    flex:'1'
  },
  centerTitle: {
    fontSize:'1.6rem',
    color:'#FF5722',
    textAlign:'center'
  },
  paragraph: {
    margin:0,
    fontSize:'0.95rem',
    lineHeight:'1.6',
    color:'#c7d2da'
  },
  heroNote: {
    marginTop:'1.5rem',
    fontSize:'0.9rem',
    lineHeight:'1.6',
    color:'#ccc',
    textAlign:'center'
  },

  /************************************************************
   * (B) Upload
   ************************************************************/
  uploadSection: {
    margin:'1.5rem auto 2.5rem',
    maxWidth:'800px',
    textAlign:'center'
  },
  uploadHint: {
    fontSize:'0.9rem',
    color:'#ffcc80',
    marginBottom:'0.75rem'
  },
  uploadRow: {
    display:'flex',
    alignItems:'center',
    gap:'1rem',
    justifyContent:'center',
    background:'#161d27',
    padding:'1rem',
    borderRadius:'8px',
    boxShadow:'0 3px 10px rgba(0,0,0,0.5)'
  },
  uploadLabel: {
    display:'flex',
    alignItems:'center',
    gap:'0.7rem',
    background:'#1e1e1e',
    border:'1px solid #444',
    padding:'0.8rem',
    borderRadius:'6px'
  },
  fileInput: {
    width:'260px',
    cursor:'pointer',
    background:'#fff',
    borderRadius:'4px'
  },
  trialButton: {
    backgroundColor:'#FF5722',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    fontSize:'1rem',
    fontWeight:600,
    padding:'0.65rem 1.2rem',
    cursor:'pointer'
  },

  /************************************************************
   * (C) Marketing with single-line (Logo + "Welcome")
   ************************************************************/
  marketingSection: {
    margin:'2rem auto',
    maxWidth:'900px',
    backgroundColor:'#161d27',
    borderRadius:'8px',
    padding:'2rem',
    boxShadow:'0 4px 10px rgba(0,0,0,0.5)',
    textAlign:'center'
  },
  marketingHeader: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    gap:'0.75rem',
    marginBottom:'1rem'
  },
  logoImg: {
    height:'3.5rem'
  },
  marketingH2: {
    color:'#FF5722',
    fontSize:'1.6rem',
    margin:0
  },
  marketingDesc: {
    fontSize:'1rem',
    color:'#eceff1',
    lineHeight:'1.6',
    marginBottom:'1.5rem'
  },
  subscribeBtn: {
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    fontSize:'1rem',
    fontWeight:600,
    padding:'0.6rem 1.2rem',
    marginBottom:'1.5rem',
    cursor:'pointer'
  },
  expandBox: {
    textAlign:'left',
    margin:'1rem auto',
    border:'1px solid #ff6f00',
    borderRadius:'6px',
    padding:'1rem',
    background:'#12181f'
  },
  expandSummary: {
    color:'#ff6f00',
    fontWeight:600,
    cursor:'pointer'
  },
  expandContent: {
    marginTop:'0.5rem',
    color:'#ccc',
    fontSize:'0.95rem',
    lineHeight:'1.6'
  },
  highlight: {
    marginTop:'1rem',
    color:'#ffd54f',
    fontWeight:600
  },

  /************************************************************
   * (D) Footer
   ************************************************************/
  footer: {
    marginTop:'auto',
    textAlign:'center',
    padding:'1rem'
  },
  footerDivider: {
    width:'60%',
    margin:'1rem auto',
    borderColor:'#FF5722'
  },
  footerText: {
    fontSize:'0.9rem',
    color:'#b0bec5',
    lineHeight:'1.6'
  }
};
