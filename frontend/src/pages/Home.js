import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 上傳檔案 => base64 存 localStorage
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = function(evt) {
      if (evt.target.readyState === FileReader.DONE) {
        localStorage.setItem('uploadedFileBase64', evt.target.result);
        localStorage.setItem('uploadedFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // 前往 Step1
  const handleProveOriginalNow = () => {
    window.location.href = '/protect/step1';
  };

  return (
    <div style={styles.container}>
      
      {/*********************************************************************
       * (A) 頂部三欄式 Navbar
       *     左：Contact Us, Sign Up
       *     中：台灣圖示 + SUZOO IP Guard (置中)
       *     右：Login
       *********************************************************************/}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <a href="/contact" style={styles.navLink}>Contact Us</a>
          <a href="/register" style={styles.navLink}>Sign Up</a>
        </div>
        <div style={styles.navCenter}>
          <img 
            src="/taiwan.png" 
            alt="Taiwan" 
            style={{ height:'1.5rem', marginRight:'0.5rem', verticalAlign:'middle' }}
          />
          <span style={{ fontWeight:600, fontSize:'1.1rem', color:'#ffab40' }}>
            SUZOO IP Guard
          </span>
        </div>
        <div style={styles.navRight}>
          <a href="/login" style={styles.navLink}>Login</a>
        </div>
      </header>
      
      {/*********************************************************************
       * (B) Hero Banner (僅一次)
       *********************************************************************/}
      <section style={styles.heroBanner}>
        <h1 style={styles.heroTitle}>
          THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.heroDesc}>
          We are proudly Taiwanese (台灣🇹🇼), and the only platform combining blockchain and AI
          to prove true authorship worldwide. 
          <br/><br/>
          Are you still struggling to prove your <strong>original creation</strong>? Under international copyright law,
          failing to establish originality means losing your rights entirely — <em>no matter how creative you are</em>.
          <br/><br/>
          <strong>ONLY WE</strong> solve this once-impossible challenge:
          <strong> Blockchain Digital Fingerprint + AI Infringement Detection</strong>,
          backed by rapid global legal actions.
          <br/><br/>
          Proving originality has always been difficult — <strong>but not anymore</strong>. We reduce
          complex copyright evidence to a single step: 100% tamper-proof, globally recognized,
          and admissible in courts everywhere.
        </p>
      </section>

      {/*********************************************************************
       * (C) 檔案上傳 + 按鈕 => 同一行, 按鈕文字短化
       *********************************************************************/}
      <section style={styles.uploadSection}>
        <label style={styles.inlineLabel}>
          Upload Short Video (Dynamic) or Image (Static):
          <input
            type="file"
            style={styles.fileInput}
            onChange={handleFileChange}
          />
        </label>
        <button style={styles.proveBtn} onClick={handleProveOriginalNow}>
          Prove Now
        </button>
      </section>

      {/*********************************************************************
       * (D) 保留 "Welcome to SUZOO IP Guard" 行銷區
       *********************************************************************/}
      <section style={styles.welcomeSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard</h2>
        <p style={styles.welcomeDesc}>
          Every second counts—someone might be stealing your ideas right now!  
          Our mission is to safeguard your valuable creations with unstoppable technology and a global legal network.
        </p>

        <details style={styles.detailBox}>
          <summary style={styles.detailSummary}>
            Why “Proof of Originality” Matters (點此展開)
          </summary>
          <div style={styles.detailContent}>
            <p>
              Without solid evidence of authorship, you risk losing your rights.  
              We provide a <strong>blockchain timestamp</strong> plus <strong>AI-based detection</strong>, making your original works recognized worldwide.
            </p>
            <p style={styles.highlight}>
              Join us now and secure your creations in any legal battle!
            </p>
          </div>
        </details>
      </section>

      {/*********************************************************************
       * (E) Footer (公司資訊)
       *********************************************************************/}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>Epic Global International Co., Ltd.</strong><br/>
          <strong>Headquarters:</strong> 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          <strong>Banqiao Office:</strong> No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          <strong>Contact:</strong> +886 900-296-168
        </p>
      </footer>
    </div>
  );
}

/** 樣式 */
const styles = {
  container: {
    backgroundColor:'#0a0f17',
    color:'#f5faff',
    minHeight:'100vh',
    display:'flex',
    flexDirection:'column'
  },

  /* (A) Navbar */
  navbar: {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    backgroundColor:'#141414',
    padding:'0.5rem 2rem',
    borderBottom:'1px solid #444'
  },
  navLeft: {
    display:'flex',
    gap:'1rem'
  },
  navCenter: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center'
  },
  navRight: {
    display:'flex',
    gap:'1rem'
  },
  navLink: {
    color:'#ffcc80',
    textDecoration:'none',
    fontWeight:500
  },

  /* (B) Hero banner */
  heroBanner: {
    padding:'3rem 2rem',
    textAlign:'center',
    backgroundColor:'#12181f',
    border:'3px solid #FF5722',
    margin:'1rem auto',
    maxWidth:'1200px',
    borderRadius:'12px',
    boxShadow:'0 8px 24px rgba(255,87,34,0.4)'
  },
  heroTitle: {
    fontSize:'2.2rem',
    color:'#FF5722',
    marginBottom:'1rem'
  },
  heroDesc: {
    fontSize:'1rem',
    lineHeight:'1.8',
    color:'#c7d2da'
  },

  /* (C) File Upload + Button in one line */
  uploadSection: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    gap:'1rem',
    margin:'2rem auto',
    maxWidth:'600px'
  },
  inlineLabel: {
    display:'flex',
    alignItems:'center',
    gap:'0.75rem',
    color:'#ffcc80'
  },
  fileInput: {
    background:'#fff',
    borderRadius:'4px',
    cursor:'pointer'
  },
  proveBtn: {
    backgroundColor:'#FF5722',
    border:'none',
    borderRadius:'4px',
    color:'#fff',
    fontSize:'1rem',
    fontWeight:600,
    padding:'0.6rem 1.2rem',
    cursor:'pointer'
  },

  /* (D) Welcome Section */
  welcomeSection: {
    margin:'2rem auto',
    maxWidth:'900px',
    textAlign:'center',
    backgroundColor:'#161d27',
    padding:'2rem',
    borderRadius:'10px',
    boxShadow:'0 8px 20px rgba(0,0,0,0.6)'
  },
  welcomeTitle: {
    fontSize:'1.8rem',
    color:'#FF5722',
    marginBottom:'1rem'
  },
  welcomeDesc: {
    fontSize:'1rem',
    color:'#eceff1',
    marginBottom:'1.5rem',
    lineHeight:'1.6'
  },
  detailBox: {
    textAlign:'left',
    border:'1px solid #ff6f00',
    borderRadius:'6px',
    padding:'1rem',
    background:'#12181f'
  },
  detailSummary: {
    color:'#ff6f00',
    cursor:'pointer',
    fontWeight:600
  },
  detailContent: {
    marginTop:'0.5rem',
    color:'#ccc',
    fontSize:'0.95rem'
  },
  highlight: {
    marginTop:'1rem',
    color:'#ffd54f',
    fontWeight:600
  },

  /* (E) Footer */
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
