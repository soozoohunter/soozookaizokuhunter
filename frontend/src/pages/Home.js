// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 檔案選擇 → base64 存於 localStorage 以便 Step1 使用
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

  // 按鈕 → 前往 Step1
  const handleProofNow = () => {
    window.location.href = '/protect/step1';
  };

  return (
    <div style={styles.container}>
      
      {/****************************************************************
       * (A) Hero 3欄佈局
       *     左欄(中文), 中欄(大標題), 右欄(英文)
       ****************************************************************/}
      <section style={styles.heroSection}>
        <div style={styles.heroRow}>

          {/* 左：中文介紹 */}
          <div style={styles.heroColLeft}>
            <p style={styles.chineseText}>
              我們是台灣（🇹🇼）唯一結合區塊鏈與AI的原創證明平台。<br/>
              仍在為了證明自己的原創性而苦惱嗎？  
              在國際著作權法下，若無法先行證明原創，  
              您的權利恐在瞬間喪失。
            </p>
          </div>

          {/* 中：大標題 */}
          <div style={styles.heroColCenter}>
            <h1 style={styles.centerTitle}>
              BLOCKCHAIN & AI-POWERED<br/>
              ORIGINAL PROOF PLATFORM
            </h1>
          </div>

          {/* 右：英文介紹 */}
          <div style={styles.heroColRight}>
            <p style={styles.englishText}>
              We are proudly Taiwanese (🇹🇼), the only platform combining blockchain and AI
              to prove authorship worldwide.<br/>
              Still struggling to prove your <strong>original creation</strong>?  
              Without solid proof, you risk losing your rights entirely — <em>no matter how creative you are</em>.
            </p>
          </div>
        </div>

        {/* 下方補充說明 (若需要) */}
        <p style={styles.heroBottom}>
          By leveraging <strong>Blockchain Digital Fingerprint + AI Infringement Detection</strong>, 
          we reduce complex copyright evidence to a single step — 100% tamper-proof, globally recognized, 
          and admissible in courts everywhere.
        </p>
      </section>

      {/****************************************************************
       * (B) 檔案上傳（大輸入框） + 按鈕
       ****************************************************************/}
      <section style={styles.uploadSection}>
        <div style={styles.uploadRow}>

          {/* 中：檔案上傳 (加寬) */}
          <label style={styles.uploadLabel}>
            <span style={{ marginRight:'0.5rem' }}>Upload File:</span>
            <input
              type="file"
              style={styles.fileInput}
              onChange={handleFileChange}
            />
          </label>

          {/* 右：Proof Now */}
          <button style={styles.proofButton} onClick={handleProofNow}>
            Proof Now
          </button>
        </div>
      </section>

      {/****************************************************************
       * (C) 下方行銷區 + LOGO + Additional details
       ****************************************************************/}
      <section style={styles.marketingSection}>
        {/* Logo + SUZOO */}
        <div style={styles.logoRow}>
          <img 
            src="/logo0.jpg" 
            alt="SUZOO Logo" 
            style={styles.logoImg}
          />
          <span style={styles.logoText}>SUZOO IP Guard</span>
        </div>

        <h2 style={styles.marketingTitle}>Welcome to SUZOO IP Guard</h2>
        <p style={styles.marketingDesc}>
          Every second counts — someone might be stealing your ideas right now!
          Our mission is to help you secure your creative assets with unstoppable technology
          and a global legal network.
        </p>

        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Why "Proof of Originality" Matters (點此展開)
          </summary>
          <div style={styles.expandContent}>
            <p>
              【繁中】根據台灣與國際著作權法，<strong>原創性</strong>必須「具體表達」才受保護。
              我們透過 <strong>區塊鏈時間戳</strong> + <strong>AI比對</strong>，  
              提供您跨國不可辯駁的著作權存證，避免侵權者佔盡便宜。
            </p>
            <p>
              【EN】Without strong evidence, you could lose your rights entirely.
              <strong> Blockchain timestamps</strong> plus <strong>AI detection</strong>
              give you unstoppable power to defend your works worldwide.
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>法理補充</strong>:  
              1) 著作權法保護「表達」非「概念」；  
              2) 未先行存證者往往在訴訟居劣勢；  
              3) AI + 區塊鏈讓創作保護變得簡單、不可篡改；  
              4) DMCA、全球律師團可急速執行下架與索賠。
            </p>
            <p style={styles.highlight}>
              Protect your IP once and for all.  
              (現在就立即行動，確保您的創作權益萬無一失！)
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
          <strong>🇹🇼Epic Global International Co., Ltd.</strong><br/><br/>
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
   * (A) Hero 3欄, 左中文 / 中標題 / 右英文
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
    flex:'1',
    fontSize:'0.95rem',
    lineHeight:'1.6',
    color:'#c7d2da'
  },
  heroColCenter: {
    flex:'1',
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  },
  heroColRight: {
    flex:'1',
    fontSize:'0.95rem',
    lineHeight:'1.6',
    color:'#c7d2da'
  },
  centerTitle: {
    fontSize:'1.6rem',
    color:'#FF5722',
    textAlign:'center'
  },
  chineseText: {
    margin:0
  },
  englishText: {
    margin:0
  },
  heroBottom: {
    marginTop:'1.5rem',
    fontSize:'0.9rem',
    lineHeight:'1.6',
    color:'#ccc',
    textAlign:'center'
  },

  /************************************************************
   * (B) Upload Row
   ************************************************************/
  uploadSection: {
    margin:'1.5rem auto 2.5rem',
    maxWidth:'800px'
  },
  uploadRow: {
    display:'flex',
    alignItems:'center',
    gap:'1rem',
    background:'#161d27',
    padding:'1rem',
    borderRadius:'8px',
    boxShadow:'0 3px 10px rgba(0,0,0,0.5)',
    justifyContent:'center'
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
    borderRadius:'4px',
    padding:'0.4rem'
  },
  proofButton: {
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
   * (C) Marketing Section + LOGO
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
  logoRow: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    gap:'0.5rem',
    marginBottom:'1rem'
  },
  logoImg: {
    height:'3.5rem'
  },
  logoText: {
    fontSize:'1.4rem',
    color:'#ff6f00',
    fontWeight:'bold'
  },
  marketingTitle: {
    fontSize:'1.8rem',
    color:'#FF5722',
    marginBottom:'1rem'
  },
  marketingDesc: {
    fontSize:'1rem',
    color:'#eceff1',
    lineHeight:'1.6',
    marginBottom:'1.5rem'
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
