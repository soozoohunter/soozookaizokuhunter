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
        // 儲存檔案於 localStorage (示範用)
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
      {/* 1) Hero Section + File Upload (放最上方) */}
      <section style={styles.heroSection}>
        <div style={styles.heroHeader}>
          <img src="/logo0.jpg" alt="SUZOO Logo" style={styles.logo} />
          <h1 style={styles.heroTitle}>
            THE WORLD’S ONLY Blockchain & AI-Powered Originality Proof Platform
          </h1>
        </div>

        <p style={styles.heroSubtitle}>
          Instantly secure your creativity with unbreakable blockchain timestamps and AI-based detection. 
          <br />
          透過堅不可摧的區塊鏈與 AI 偵測技術，立即守護您的智慧財產權。
        </p>

        {/* 上傳區塊 + 免費試用 */}
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
        <h2 style={styles.marketingTitle}>Protect Your Creations Now</h2>
        <p style={styles.marketingDesc}>
          Proving originality is the hardest challenge in copyright protection. 
          Without solid evidence, you risk losing your work—no matter how innovative it is.
          <br/>
          著作權最大的難題在於「原創證明」。若缺乏有效證據，無論作品多有創意，都可能失去保護。
        </p>
        <p style={styles.marketingDetail}>
          SUZOO IP GUARD tackles this head-on with a two-pronged approach: <br/>
          <strong>Immutable Blockchain Fingerprints</strong> + <strong>Real-time AI Monitoring</strong>.
          <br/><br/>
          我們結合「區塊鏈指紋」與「AI 即時監控」雙重防線，替您奠定無懈可擊的原創證明。
        </p>
        <button style={styles.subscribeButton} onClick={handleSubscribe}>
          Start Protection Now / 立即開始保護
        </button>
      </section>

      {/* 3) Unique Selling Point */}
      <section style={styles.uniqueSection}>
        <h3 style={styles.uniqueTitle}>Why We're Truly One-of-a-Kind</h3>
        <p style={styles.uniqueText}>
          Other services only spot text plagiarism. We detect design nuances, visual elements, and partial modifications.
          <br/>
          一般平台僅能偵測文字抄襲，但我們能精準捕捉設計細節、圖像元素乃至部分改作。
        </p>
        <p style={styles.uniqueText}>
          Proudly made in Taiwan, the <strong>only</strong> solution worldwide 
          that solves the hardest challenge—proving you are the true originator.
          <br/>
          由台灣團隊自豪研發，世界唯一可徹底解決「原創證明」難題，替創作者掃除最大的法律障礙。
        </p>
      </section>

      {/* 4) Detailed Copyright Info - Expandable */}
      <section style={styles.infoSection}>
        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Learn More About Copyright & Originality (詳細閱讀)
          </summary>
          <div style={styles.expandContent}>
            <p style={{ fontWeight: 'bold' }}>一、著作必須具備「原創性」</p>
            <p>
              「原創性」包含原始性及創作性。從法律與實務面來看，只要您的創作能證明獨立完成、非抄襲，
              且展現最低程度的創意，即受著作權法保護。<br/>
              <em>In English: “Originality” under law involves both independence and creativity. 
              As long as you can show the work is independently made, not plagiarized, 
              and meets a minimal level of creativity, it’s protected.</em>
            </p>

            <p style={{ fontWeight: 'bold' }}>二、著作完成才能主張權利</p>
            <p>
              著作權法保護「表達」，不保護「概念」。即使有創新想法，但未完成客觀的表達，仍無法主張著作權。<br/>
              <em>In English: Copyright safeguards “expression” over “ideas.” 
              If you haven’t expressed your concept in a tangible way, you can’t claim rights.</em>
            </p>

            <p style={{ fontWeight: 'bold' }}>三、獨立創作才不會侵害他人</p>
            <p>
              同一顆蘋果，每個人都能畫出不同的畫法，只要不是抄襲，即各自享有著作權。<br/>
              <em>In English: Multiple people can draw the same apple in their own style. 
              If it’s not copied from another’s artwork, each is protected separately.</em>
            </p>

            <p style={{ fontWeight: 'bold' }}>四、舉證：證明「誰、何時、怎麼創作」</p>
            <p>
              最難的就是證明自己是作者、何時完成、以及作品為獨立創作。若無法提出確切證據，可能導致權利落空。<br/>
              <em>In English: The hardest part is proving authorship, completion time, and independence. 
              Lacking solid evidence, your rights can be easily dismissed.</em>
            </p>

            <p style={{ marginTop: '1rem' }}>
              <strong>進一步延伸閱讀：</strong>  
              (以下為原始著作權法條文與案例分析)  
              <br/>
              {/* 在此插入您給予的長篇法條或案例文章，為使程式碼示範精簡，暫以文字代替 */}
              您可將更完整的著作權法條與實務判決，放置於此處進行展開補充...
            </p>
          </div>
        </details>
      </section>

      {/* 5) Footer */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          <strong>🇹🇼🇭🇰🇨🇦Epic Global International Co., Ltd.</strong><br/>
          Headquarters: 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          Banqiao Office: No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
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
    gap: '0.8rem'
  },
  logo: {
    height: '50px'
  },
  heroTitle: {
    color: '#FF5722',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    margin: 0
  },
  heroSubtitle: {
    marginTop: '1rem',
    color: '#c7d2da',
    lineHeight: 1.6,
    fontSize: '1rem'
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
    marginBottom: '1rem',
    textAlign: 'center'
  },
  marketingDesc: {
    color: '#eceff1',
    marginBottom: '1rem',
    textAlign: 'center',
    lineHeight: 1.6
  },
  marketingDetail: {
    color: '#ccc',
    marginBottom: '1.5rem',
    textAlign: 'center',
    lineHeight: 1.7
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

  /* 4) Info / Expand Box */
  infoSection: {
    marginBottom: '2rem'
  },
  expandBox: {
    background: '#12181f',
    borderRadius: '8px',
    padding: '1rem',
    color: '#ccc'
  },
  expandSummary: {
    color: '#FF5722',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '1rem',
    fontWeight: '600'
  },
  expandContent: {
    marginTop: '1rem',
    lineHeight: 1.6,
    fontSize: '0.95rem'
  },

  /* 5) Footer */
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
