import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        // 將檔案的 Base64 和檔名存到 localStorage (示範用)
        localStorage.setItem('uploadedFileBase64', evt.target.result);
        localStorage.setItem('uploadedFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFreeTrial = () => {
    window.location.href = '/protect/step1';
  };

  const handleSubscribe = () => {
    window.location.href = '/pricing';
  };

  return (
    <div style={styles.container}>
      {/* 1) Hero + Upload Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroHeader}>
          <img src="/logo0.jpg" alt="SUZOO Logo" style={styles.logo} />
          <h1 style={styles.heroTitle}>
            THE WORLD’S ONLY Blockchain & AI-Powered Originality Proof Platform
          </h1>
        </div>

        <p style={styles.heroSubtitle}>
          Instantly safeguard your work with immutable blockchain records and AI-driven infringement detection. <br/>
          透過區塊鏈+AI技術，立即為您的創作建立無懈可擊的原創證明。
        </p>

        {/* 上傳檔案 + 免費試用按鈕 */}
        <div style={styles.uploadRow}>
          <label style={styles.uploadLabel}>
            <input type="file" style={styles.fileInput} onChange={handleFileChange} />
            <span style={styles.uploadText}>
              {selectedFile ? selectedFile.name : 'Upload Your Original Work'}
            </span>
          </label>
          <button style={styles.trialButton} onClick={handleFreeTrial}>
            Hunter for Free / 免費試用
          </button>
        </div>
      </section>

      {/* 2) Marketing / Intro Section */}
      <section style={styles.marketingSection}>
        <h2 style={styles.marketingTitle}>Welcome to SUZOO IP GUARD</h2>
        <p style={styles.marketingDesc}>
          The hardest part of copyright protection is proving you’re the original creator.<br/>
          在著作權的保護裡，最困難的往往是如何證明自己就是原創作者。
        </p>
        <p style={styles.marketingDetail}>
          That’s exactly where we excel. By combining unbreakable blockchain timestamps with AI “fingerprinting,” 
          we deliver ironclad evidence of originality—saving you from the nightmare of legal uncertainties.<br/>
          我們透過區塊鏈時間戳與 AI 指紋比對，為您的作品提供最具法律效力的原創證據，
          從此不再害怕舉證困難而導致權利流失。
        </p>

        {/* CTA: 立即保護 */}
        <button style={styles.subscribeButton} onClick={handleSubscribe}>
          Start Protection Now / 立即開始保護
        </button>

        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Why Is “Proof of Originality” So Crucial? (點此展開)
          </summary>
          <div style={styles.expandContent}>
            <p>
              Under international copyright law, failing to prove your ownership often means losing your rights entirely—
              even if you truly created the work. Courts typically require proof of:
            </p>
            <ul style={styles.bulletList}>
              <li><strong>Creator Identity</strong>: You must show you had the ability and resources to produce the work.</li>
              <li><strong>Completion Time</strong>: The exact moment your work became a fixed, finished expression.</li>
              <li><strong>Independent Creation</strong>: Evidence you didn’t copy from earlier works—i.e., originality.</li>
            </ul>
            <p>
              根據實務判決，著作人必須舉證證明（1）著作人身分，（2）著作完成時間，（3）獨立創作非抄襲。<br/>
              這些舉證往往難度極高，一旦無法證明，就可能喪失著作權的保障。
            </p>
            <p style={styles.highlight}>
              With SUZOO IP GUARD, all this complexity is reduced to one click. 
              We record your creation on an immutable ledger, scan the internet via AI 24/7,
              and stand by to launch global legal action whenever infringement is detected.
              <br/><br/>
              使用 SUZOO IP GUARD，一鍵完成所有複雜舉證流程，區塊鏈不可竄改紀錄搭配
              AI 二十四小時監控，全球追蹤，一旦發現侵權立即採取法律行動！
            </p>
          </div>
        </details>
      </section>

      {/* 3) Unique Value / Bottom Explanation */}
      <section style={styles.uniqueSection}>
        <h3 style={styles.uniqueTitle}>Why Are We the Only One?</h3>
        <p style={styles.uniqueText}>
          Most solutions merely detect plagiarism of text. But copyright disputes often involve subtle visuals, designs, 
          or partial transformations. Only our blockchain + AI synergy offers true, all-encompassing originality proof. <br/>
          多數平台只能檢測文字重複率，卻無法在視覺、設計、或二次改作等領域有效辨別侵權。
          我們獨家整合區塊鏈與 AI 指紋技術，真正全面守護您的原創力。
        </p>
        <p style={styles.uniqueText}>
          Proudly made in Taiwan, protecting authors worldwide. <br/>
          全世界只有台灣的我們，做到了「舉證最難」的著作權問題一次解決。
        </p>
      </section>

      {/* 4) Footer */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>Epic Global International Co., Ltd.</strong><br/>
          Headquarters: 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          Banqiao Office: No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          Contact: +886 900-296-168 (GM Zack Yao)
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'Inter, sans-serif'
  },
  /* 1) Hero Section */
  heroSection: {
    textAlign: 'center',
    padding: '2rem',
    background: '#12181f',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
    marginBottom: '2rem'
  },
  heroHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem'
  },
  logo: {
    height: '50px'
  },
  heroTitle: {
    color: '#FF5722',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    margin: 0
  },
  heroSubtitle: {
    marginTop: '1rem',
    color: '#c7d2da',
    lineHeight: 1.6
  },
  uploadRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '2rem',
    flexWrap: 'wrap'
  },
  uploadLabel: {
    background: '#1e1e1e',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer'
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
    padding: '0.7rem 1.2rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  },

  /* 2) Marketing Section */
  marketingSection: {
    background: '#161d27',
    padding: '2rem',
    borderRadius: '10px',
    marginBottom: '2rem'
  },
  marketingTitle: {
    color: '#FF5722',
    fontSize: '1.6rem',
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  marketingDesc: {
    color: '#eceff1',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  marketingDetail: {
    color: '#ccc',
    marginBottom: '1.5rem',
    textAlign: 'center',
    lineHeight: 1.6
  },
  subscribeButton: {
    display: 'block',
    margin: '0 auto',
    backgroundColor: '#ff6f00',
    color: '#fff',
    padding: '0.7rem 1.4rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  },
  expandBox: {
    marginTop: '1.5rem',
    background: '#12181f',
    borderRadius: '8px',
    padding: '1rem',
    color: '#ccc'
  },
  expandSummary: {
    color: '#FF5722',
    cursor: 'pointer',
    outline: 'none'
  },
  expandContent: {
    marginTop: '1rem',
    lineHeight: 1.6,
    fontSize: '0.95rem'
  },
  bulletList: {
    marginLeft: '1.5rem',
    marginTop: '0.5rem'
  },
  highlight: {
    marginTop: '1rem',
    color: '#ffd54f',
    fontWeight: '600'
  },

  /* 3) Unique Section */
  uniqueSection: {
    backgroundColor: '#0f131a',
    border: '2px solid #ff6f00',
    borderRadius: '10px',
    padding: '2rem',
    marginBottom: '2rem'
  },
  uniqueTitle: {
    fontSize: '1.4rem',
    color: '#FF5722',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  uniqueText: {
    color: '#ccc',
    lineHeight: 1.6,
    marginBottom: '1rem'
  },

  /* 4) Footer */
  footer: {
    textAlign: 'center',
    color: '#b0bec5',
    marginTop: '2rem'
  },
  footerDivider: {
    width: '60%',
    margin: '1rem auto',
    borderColor: '#FF5722'
  },
  footerText: {
    fontSize: '0.9rem',
    lineHeight: 1.6
  }
};
