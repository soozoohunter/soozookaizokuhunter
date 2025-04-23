/*************************************************************
 * frontend/src/pages/Home.js
 * - 僅保留一次 "Secure Your IP..." 區塊
 * - 在 "THE WORLD'S ONLY..." 標題下方，並排: 檔案上傳 + ProtectNow 按鈕
 * - 移除最底部那個重複區塊
 * - 加入英文文案 "We are truly the world’s one and only..."
 *************************************************************/
import React, { useState } from 'react';

export default function Home() {
  // 若需要檔案狀態
  const [file, setFile] = useState(null);

  // 上傳檔案 (示範)
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      console.log('Selected file:', e.target.files[0]);
    }
  };

  // 按鈕動作 (示範)
  const handleProtectNow = () => {
    if (!file) {
      alert('請先選擇檔案');
      return;
    }
    // 這裡可串接您後端 API
    alert(`ProtectNow clicked, file=${file.name}`);
  };

  return (
    <div style={styles.container}>
      {/* Banner 區塊 */}
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

        {/* ★ 在此 banner 區塊下方，並排: 上傳檔案 + ProtectNow 按鈕 */}
        <div style={styles.uploadRow}>
          {/* 檔案上傳 */}
          <input 
            type="file" 
            onChange={handleFileChange} 
            style={styles.fileInput} 
          />

          {/* ProtectNow 按鈕 */}
          <button 
            style={styles.protectBtn}
            onClick={handleProtectNow}
          >
            Protect Now
          </button>
        </div>
      </div>

      {/* 行銷文案: "Welcome to SUZOO IP Guard" or "我們是世界唯一" */}
      <div style={styles.bottomSection}>
        <h2 style={styles.bottomTitle}>
          Welcome to SUZOO IP Guard 🚀
        </h2>
        <p style={styles.bottomDesc}>
          Every second counts—someone might be stealing your ideas right now!
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor:'pointer', color:'#FF5722', marginBottom:'1rem' }}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={{ marginTop:'1rem', lineHeight:'1.6', fontSize:'0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，
              <strong>著作權保護</strong>與<strong>著作權原創證明</strong>至關重要，
              特別是在無強制登記制度下，創作者必須自行舉證
              <strong>著作權</strong>之原創性與完成時間。無法有效舉證，則在法律訴訟中幾乎必敗無疑。
            </p>
            <p>
              我們的平台提供全球獨一無二的解決方案，以區塊鏈技術創建永久不可篡改之證據，結合強力AI偵測侵權。
              只需點擊幾下，即可完成原創認證與<strong>著作權保護</strong>，
              讓您在全球法庭上都能取得壓倒性證明效力。
            </p>
            <p style={{ marginTop:'1rem' }}>
              <strong>【EN】</strong>  
              Under both Taiwanese and international copyright laws,
              the burden of proof for originality lies with creators—
              no mandatory registration is required, but failure to prove authorship
              usually results in losing the case.
              We are the ONLY platform that integrates blockchain immutability 
              and powerful AI infringement detection.
            </p>
            <p style={{ marginTop:'1rem', color:'#ffd54f', fontWeight:'600' }}>
              Join us now and defend your creative value like never before!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>我們是世界唯一！</strong> 只有我們能將區塊鏈與
          <strong>著作權原創證明</strong>完美結合，並提供即時掃描、
          DMCA強制下架與全球法律行動。別再猶豫，立即行動吧！<br/><br/>
          <span style={{ color: '#ffd54f', fontWeight: '600', fontSize: '1rem' }}>
            We are truly the world’s one and only service that fuses blockchain and AI 
            to safeguard your creative works with instant, indisputable proof.
          </span>
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
    paddingBottom: '3rem'
  },
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    margin: '2rem auto',
    maxWidth: '1200px',
    padding: '2rem 3rem',
    background: '#12181f',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)'
  },
  mainTitle: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    marginBottom: '1.2rem',
    color: '#FF5722',
    textAlign: 'center'
  },
  desc: {
    fontSize: '1rem',
    lineHeight: '1.8',
    color: '#c7d2da',
    textAlign: 'left'
  },
  uploadRow: {
    marginTop: '1.5rem',
    display: 'flex',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem'
  },
  fileInput: {
    padding: '0.5rem',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  protectBtn: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  bottomSection: {
    margin: '2rem auto',
    maxWidth: '1000px',
    padding: '2rem'
  },
  bottomTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  bottomDesc: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#eceff1'
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
    fontSize: '1.1rem',
    color: '#ffd54f',
    fontWeight: '600',
    textAlign: 'center'
  }
};
