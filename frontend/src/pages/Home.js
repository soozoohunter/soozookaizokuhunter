// frontend/src/pages/Home.js

import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  // 上傳檔案
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    // 如有需要，可將檔案轉為 base64 存到 localStorage
  };

  // 「Protect My Work」按鈕 → 前往 /protect/step1
  const handleProtect = () => {
    window.location.href = '/protect/step1';
  };

  // 「View Plans」按鈕 → 前往 /pricing
  const handleViewPlans = () => {
    window.location.href = '/pricing';
  };

  return (
    <div style={styles.container}>
      {/* 
        1) 最上方：直向排列 (單一column) 
           包含：
           - 大標題 & 說明文字
           - 「Upload」(file input)
           - 「Protect My Work」按鈕
           - 「Secure Your IP Now」小標 
      */}
      <section style={styles.topSection}>
        <h1 style={styles.mainTitle}>
          THE WORLD’S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>

        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to safeguarding creators worldwide.
          <br /><br />
          Are you still risking losing your intellectual property due to inadequate proof of originality?
          Under international copyright law, failing to prove originality means
          losing your rights entirely—regardless of your creativity.
          <br /><br />
          <strong>ONLY WE</strong> offer a solution powerful enough to end this nightmare instantly:
          <strong> Blockchain Digital Fingerprint</strong> combined with
          <strong> AI Infringement Detection</strong> and rapid global legal actions.
          <br /><br />
          <strong>Proving originality is notoriously challenging — but not anymore.</strong> 
          We simplify complex copyright evidence into a single click.
          Connect your accounts, and the blockchain instantly becomes your undeniable proof
          of originality: 100% tamper-proof, globally recognized, and admissible in courts everywhere.
        </p>

        {/* 上傳欄 & 按鈕(直向) */}
        <div style={styles.uploadSection}>
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

          <button style={styles.actionButton} onClick={handleProtect}>
            Protect My Work
          </button>
        </div>

        {/* Secure Your IP Now 小標 / 行銷文案 */}
        <h2 style={styles.subHeading}>Secure Your IP Now</h2>
        <p style={styles.subDesc}>
          (EN) Every second counts—someone might be stealing your ideas right now!
          <br />
          【繁中】每一秒都至關重要，您的創意可能此刻正被他人盯上！
          <br /><br />
          Combine real-time AI scanning and global legal readiness to ensure your copyright
          stands on unshakeable ground.
        </p>

        {/* 「View Plans」按鈕 */}
        <button style={styles.viewPlansButton} onClick={handleViewPlans}>
          View Plans
        </button>
      </section>

      {/* 2) Additional Marketing / Explanation */}
      <section style={styles.marketingSection}>
        <h2 style={styles.marketingTitle}>Why Our Service Is Unique</h2>
        <p style={styles.marketingDesc}>
          (EN) Unlike typical plagiarism checkers, we detect subtle design tweaks,
          partial transformations, and unauthorized reproductions—far beyond simple text comparisons.
          <br />
          【繁中】與一般抄襲偵測不同，我們能捕捉細微的設計改動、部分翻用及各種變形。
          <br /><br />
          Empowered by real-time AI scanning and global legal readiness,
          you can rest assured your copyright stands on unshakeable ground.
          <br />
          【繁中】透過 AI 即時掃描與全球法律行動，確保您的著作權牢不可破。
        </p>

        <details style={styles.legalBlock}>
          <summary style={styles.legalSummary}>
            Understand Why "Proof of Originality" is Critical (點此展開)
          </summary>
          <div style={styles.legalText}>
            <p>
              (EN) Under international and Taiwanese copyright law, failing to prove “originality”
              can undermine your entire legal claim. Our blockchain-proven approach ensures your
              work is authenticated the moment you create it, recognized worldwide.
            </p>
            <p>
              【繁中】依據台灣與國際著作權法，「原創性」是保護的核心。若無法證明原創，
              就難以行使法律權益。我們用區塊鏈認證，讓您的作品在創作當下即獲得全球公認的證明。
            </p>
            <p style={styles.legalEmph}>
              Join us now and defend your creative value like never before!
            </p>
          </div>
        </details>
      </section>

      {/* 3) Footer Info (公司資訊, 僅英文公司名) */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>🇹🇼Epic Global International Co., Ltd.</strong><br />
          Headquarters: 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br />
          Banqiao Office: No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br />
          Contact: +886 900-296-168 (GM Zack Yao)
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
