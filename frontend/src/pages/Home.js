// frontend/src/pages/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 上傳檔案處理
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        // 將檔案的 Base64 和檔名存到 localStorage
        localStorage.setItem('uploadedFileBase64', evt.target.result);
        localStorage.setItem('uploadedFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFreeTrial = () => {
    // 免費試用 -> /protect/step1
    window.location.href = '/protect/step1';
  };

  const handleSubscribe = () => {
    // 立即開始保護 -> /pricing
    window.location.href = '/pricing';
  };

  return (
    <div style={styles.container}>
      {/* 1) Gradient / Glow Section */}
      <section style={styles.topSection}>
        <h1 style={styles.topTitle}>
          THE WORLD’S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.topSubtitle}>
          透過堅不可摧的區塊鏈與 AI 技術，立即守護您的智慧財產權。
        </p>

        {/* 左右欄位排版 */}
        <div style={styles.rowWrapper}>
          {/* 左欄：上傳檔案 + 免費試用 */}
          <div style={styles.leftColumn}>
            <label style={styles.uploadLabel}>
              <input
                type="file"
                style={styles.fileInput}
                onChange={handleFileChange}
              />
              <span style={styles.uploadText}>
                {selectedFile ? selectedFile.name : 'Upload Your Original Work'}
              </span>
            </label>
            <button style={styles.trialButton} onClick={handleFreeTrial}>
              Hunter for Free / 免費試用
            </button>
          </div>

          {/* 右欄：立即開始保護 */}
          <div style={styles.rightColumn}>
            <h2 style={styles.protectTitle}>Protect Your Creations Now</h2>
            <p style={styles.protectDesc}>
              Proving originality is the hardest challenge in copyright protection.
              Don’t risk losing your work—act now!
              <br/>
              著作權保護最困難的就是「原創證明」，不想失去權利就立即行動！
            </p>
            <button style={styles.protectButton} onClick={handleSubscribe}>
              Start Protection Now / 立即開始保護
            </button>
          </div>
        </div>
      </section>

      {/* 2) Additional Marketing / Explanation */}
      <section style={styles.marketingSection}>
        <h2 style={styles.marketingTitle}>Why Our Service Is Unique</h2>
        <p style={styles.marketingDesc}>
          Unlike typical plagiarism checkers, we detect subtle design tweaks,
          partial transformations, and unauthorized reproductions.
          <br/>
          與一般抄襲偵測不同，我們能捕捉細微的設計改動、部分翻用、以及各種變形。
        </p>
        <p style={styles.marketingDesc}>
          Empowered by real-time AI scanning and global legal readiness, 
          you can rest assured your copyright stands on unshakeable ground.
          <br/>
          透過 AI 即時掃描與全球法律行動，確保您的著作權牢不可破。
        </p>
      </section>

      {/* 3) Footer Info (公司資訊) */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>🇹🇼🇭🇰Epic Global International Co., Ltd.</strong><br/>
          🇹🇼凱盾全球國際股份有限公司<br/><br/>
          <strong>Headquarters:</strong> 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          <strong>Banqiao Office:</strong> No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
        </p>
      </footer>
    </div>
  );
}

/** ============ Styles ============ */
const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },

  // 漸層+光影
  topSection: {
    padding: '3rem',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #12181f 0%, #1e1e1e 100%)',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
    margin: '2rem',
    textAlign: 'center'
  },
  topTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  topSubtitle: {
    fontSize: '1rem',
    color: '#c7d2da',
    marginBottom: '2rem'
  },
  rowWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    justifyContent: 'center'
  },
  leftColumn: {
    backgroundColor: '#161d27',
    padding: '1.5rem',
    borderRadius: '10px',
    minWidth: '280px'
  },
  uploadLabel: {
    display: 'block',
    backgroundColor: '#1e1e1e',
    padding: '0.6rem 1rem',
    marginBottom: '1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  fileInput: {
    display: 'none'
  },
  uploadText: {
    color: '#ccc'
  },
  trialButton: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    padding: '0.7rem 1.4rem',
    borderRadius: '4px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%'
  },
  rightColumn: {
    backgroundColor: '#161d27',
    padding: '1.5rem',
    borderRadius: '10px',
    minWidth: '280px',
    textAlign: 'center'
  },
  protectTitle: {
    fontSize: '1.4rem',
    color: '#FF5722',
    marginBottom: '1rem'
  },
  protectDesc: {
    color: '#ccc',
    lineHeight: 1.6,
    marginBottom: '1.5rem'
  },
  protectButton: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    padding: '0.7rem 1.4rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  },

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

  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    padding: '1rem'
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
