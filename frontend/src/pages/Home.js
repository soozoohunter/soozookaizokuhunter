// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 檔案選擇 → 存 base64, 以便 Step1 使用
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

  // 按下按鈕 → 前往 Step1
  const handleProofNow = () => {
    window.location.href = '/protect/step1';
  };

  return (
    <div style={styles.container}>
      
      {/*********************************************************************
       * (A) Hero區: 中間放 logo0.jpg + SUZOO IP Guard + 大標題 + 說明文案
       *********************************************************************/}
      <section style={styles.hero}>
        <div style={styles.logoRow}>
          <img 
            src="/logo0.jpg" 
            alt="SUZOO Logo" 
            style={styles.logoImg}
          />
          <span style={styles.logoText}>SUZOO IP Guard</span>
        </div>
        <h1 style={styles.heroTitle}>
          THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.heroDesc}>
          We are proudly Taiwanese (台灣 🇹🇼), and the only platform combining blockchain and AI
          to prove true authorship worldwide.<br/>
          <span style={{ display:'block', marginTop:'0.5rem' }}>
            Are you still struggling to prove your <strong>original creation</strong>? 
            Under international copyright law, failing to establish originality means losing your rights entirely— 
            <em>no matter how creative you are</em>.
          </span>
          <br/>
          <strong>ONLY WE</strong> solve this once-impossible challenge:
          <strong> Blockchain Digital Fingerprint + AI Infringement Detection</strong>,
          backed by rapid global legal actions.
          <br/><br/>
          Proving originality used to be difficult — <strong>but not anymore</strong>. 
          We reduce complex copyright evidence to a single click:
          100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>
      </section>

      {/*********************************************************************
       * (B) 單行檔案上傳 + 按鈕
       *********************************************************************/}
      <section style={styles.uploadSection}>
        <div style={styles.uploadBox}>
          {/* 左邊：提示文字 + 檔案上傳 */}
          <div style={styles.inputGroup}>
            <span style={styles.inputLabel}>Upload (Video or Image):</span>
            <input
              type="file"
              style={styles.fileInput}
              onChange={handleFileChange}
            />
          </div>
          {/* 右邊：按鈕 */}
          <button style={styles.proofBtn} onClick={handleProofNow}>
            Proof Now
          </button>
        </div>
      </section>

      {/*********************************************************************
       * (C) Welcome / 行銷區 + 展開更多著作權資訊
       *********************************************************************/}
      <section style={styles.marketingSection}>
        <h2 style={styles.marketingTitle}>Welcome to SUZOO IP Guard</h2>
        <p style={styles.marketingDesc}>
          Every second counts—someone might be stealing your ideas right now!
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
              傳統系統僅能比對文字抄襲、無法確立真正的著作完整性；沒有先行存證，往往在法律糾紛中居於弱勢。
            </p>
            <p>
              我們透過 <strong>區塊鏈時間戳</strong>、<strong>AI 侵權比對</strong> 與 DMCA 聲明，
              讓您擁有無可辯駁的著作權憑證，隨時對侵權者提出<strong>全球法律行動</strong>。
            </p>
            <p>
              【EN】Without <em>solid proof</em> of authorship, you risk losing your rights entirely. 
              By leveraging <strong>blockchain timestamps</strong> and <strong>AI detection</strong>, 
              you can effortlessly protect and defend your work across jurisdictions.
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>法理補充 (extended):</strong><br/>
              1) 著作權法只保護「表達」而非「概念」；  
              2) 「原創性」必須為獨立創作，非抄襲或剽竊；  
              3) 先行存證可使法院推定著作完成時間與作者身份；  
              4) 結合 AI 大規模比對與區塊鏈不可竄改特性，能迅速追蹤並採取法律行動；  
              5) 更可利用 DMCA 下架、全球律師團索賠等手段；  
              6) 整體機制涵蓋您所有文字、音樂、影像、程式碼等各類創作。
            </p>
            <p style={styles.highlight}>
              Secure your IP rights once and for all.  
              No more fear of plagiarism or theft.  
              <br/>
              (現在就行動，為您的創作奠定堅不可破的法律基石！)
            </p>
          </div>
        </details>
      </section>

      {/*********************************************************************
       * (D) 底部 Footer
       *********************************************************************/}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>Epic Global International Co., Ltd.</strong><br/><br/>
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

  /* (A) Hero with logo0.jpg & SUZOO text */
  heroSection: {
    textAlign:'center',
    padding:'3rem 2rem',
    border:'3px solid #FF5722',
    borderRadius:'12px',
    margin:'2rem auto 0',
    maxWidth:'1200px',
    background:'#12181f',
    boxShadow:'0 8px 24px rgba(255,87,34,0.4)'
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

  /* (B) Single-line Upload + Proof Now */
  uploadSection: {
    margin:'1.5rem auto 2.5rem',
    maxWidth:'700px',
    textAlign:'center'
  },
  uploadBox: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    background:'#161d27',
    padding:'1rem',
    borderRadius:'8px',
    boxShadow:'0 3px 10px rgba(0,0,0,0.5)',
    gap:'1rem'
  },
  inputGroup: {
    display:'flex',
    alignItems:'center',
    gap:'0.7rem',
    backgroundColor:'#1e1e1e',
    padding:'0.6rem',
    borderRadius:'6px',
    border:'1px solid #444'
  },
  inputLabel: {
    fontSize:'0.95rem',
    color:'#ffcc80'
  },
  fileInput: {
    cursor:'pointer',
    background:'#fff',
    borderRadius:'4px'
  },
  proofBtn: {
    backgroundColor:'#FF5722',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    fontSize:'1rem',
    fontWeight:600,
    padding:'0.65rem 1.2rem',
    cursor:'pointer'
  },

  /* (C) Marketing + details */
  marketingSection: {
    margin:'2rem auto',
    maxWidth:'900px',
    backgroundColor:'#161d27',
    borderRadius:'8px',
    padding:'2rem',
    boxShadow:'0 4px 10px rgba(0,0,0,0.5)',
    textAlign:'center'
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

  /* (D) Footer */
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
