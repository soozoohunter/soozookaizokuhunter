// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 檔案選擇 → 存 base64 以便 Step1 使用
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

  const handleProofNow = () => {
    window.location.href = '/protect/step1';
  };

  return (
    <div style={styles.container}>

      {/******************************************************************
       * (1) Hero 區: 僅顯示大標題 + 文案 (移除 Logo, 改至後方)
       ******************************************************************/}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.heroDesc}>
          We are proudly Taiwanese (台灣 🇹🇼), and the only platform combining blockchain and AI
          to prove true authorship worldwide. <br/><br/>
          Are you still struggling to prove your <strong>original creation</strong>?  
          Under international copyright law, failing to establish originality means losing your rights entirely— 
          <em>no matter how creative you are</em>.<br/><br/>
          <strong>ONLY WE</strong> solve this once-impossible challenge:
          <strong> Blockchain Digital Fingerprint + AI Infringement Detection</strong>,  
          backed by rapid global legal actions.<br/><br/>
          Proving originality used to be difficult — <strong>but not anymore</strong>. 
          We reduce complex copyright evidence to a single click:  
          100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>
      </section>

      {/******************************************************************
       * (2) 單行上傳 + 說明 + 按鈕
       *     文字說明 (「影音檔生成動態指紋」「圖片生成靜態指紋」) 放在左側同框
       ******************************************************************/}
      <section style={styles.uploadSection}>
        <div style={styles.uploadRow}>
          {/* 左側: 說明文字 */}
          <div style={styles.uploadInfo}>
            <p style={styles.uploadInfoText}>
              <strong>Short Video → Dynamic Fingerprint</strong><br/>
              <strong>Image → Static Fingerprint</strong>
            </p>
          </div>

          {/* 中間: 檔案上傳 */}
          <input
            type="file"
            style={styles.fileInput}
            onChange={handleFileChange}
          />

          {/* 右側: 按鈕 */}
          <button style={styles.proofButton} onClick={handleProofNow}>
            Proof Now
          </button>
        </div>
      </section>

      {/******************************************************************
       * (3) 行銷區 - Welcome + LOGO
       *     您想將 LOGO 移到這個區塊 (第三張截圖位置)
       ******************************************************************/}
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
              【繁中】根據台灣與國際著作權法，<strong>原創性</strong>必須透過「具體表達」才能獲得法律保護。
              傳統系統僅能比對文字抄襲，無法完整保護您的創作。
            </p>
            <p>
              我們透過 <strong>區塊鏈時間戳</strong> + <strong>AI 侵權比對</strong>，
              迅速提供您<strong>不可辯駁</strong>的著作權存證，並可跨國執行法律行動。
            </p>
            <p>
              【EN】Without solid proof of authorship, you risk losing everything. 
              Using <strong>blockchain timestamps</strong> and <strong>AI-driven detection</strong>,
              we help you secure your work in any legal setting around the globe.
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>法理補充</strong>:  
              1) 著作權法保護表達，不保護概念；  
              2) 原創須獨立完成，非抄襲；  
              3) 先行存證可使法院推定著作完成時間；  
              4) AI + 區塊鏈 = 快速偵測+不可竄改；  
              5) 可結合 DMCA 與全球律師團行動，力挽狂瀾。
            </p>
            <p style={styles.highlight}>
              Protect your IP once and for all.  
              (現在就立即行動，免除被侵權的後顧之憂！)
            </p>
          </div>
        </details>
      </section>

      {/******************************************************************
       * (4) Footer
       ******************************************************************/}
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

  /* (1) Hero (No logo here, just big title + text) */
  hero: {
    textAlign:'center',
    padding:'3rem 2rem',
    border:'3px solid #FF5722',
    borderRadius:'12px',
    margin:'2rem auto 0',
    maxWidth:'1200px',
    background:'#12181f',
    boxShadow:'0 8px 24px rgba(255,87,34,0.4)'
  },
  heroTitle: {
    fontSize:'2.4rem',
    color:'#FF5722',
    marginBottom:'1rem'
  },
  heroDesc: {
    fontSize:'1.05rem',
    lineHeight:'1.8',
    color:'#c7d2da'
  },

  /* (2) Single row: explanation + fileInput + button */
  uploadSection: {
    margin:'1.5rem auto 2.5rem',
    maxWidth:'800px'
  },
  uploadRow: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    gap:'1rem',
    background:'#161d27',
    padding:'1rem',
    borderRadius:'8px',
    boxShadow:'0 3px 10px rgba(0,0,0,0.5)'
  },
  uploadInfo: {
    background:'#1e1e1e',
    border:'1px solid #444',
    padding:'0.8rem',
    borderRadius:'6px'
  },
  uploadInfoText: {
    fontSize:'0.9rem',
    color:'#ffcc80',
    lineHeight:'1.4'
  },
  fileInput: {
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

  /* (3) Marketing + LOGO here */
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

  /* (4) Footer */
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
