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
        localStorage.setItem('uploadedFileBase64', evt.target.result);
        localStorage.setItem('uploadedFileName', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFreeTrial = () => window.location.href = '/protect/step1';
  const handleSubscribe = () => window.location.href = '/pricing';

  return (
    <div style={styles.container}>
      {/* Enhanced Hero + Upload Section */}
      <section style={styles.heroSection}>
        <div style={styles.marketingHeader}>
          <img src="/logo0.jpg" alt="SUZOO Logo" style={styles.logo} />
          <h1 style={styles.heroTitle}>
            THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
          </h1>
        </div>
        <p style={styles.heroSubTitle}>
          Instantly Protect Your Intellectual Property with Unbreakable Blockchain Proof & AI-driven Detection.<br/>
          透過區塊鏈與AI技術，立即確保您的智慧財產權得到無懈可擊的保障。
        </p>
        <div style={styles.uploadRow}>
          <label style={styles.uploadLabel}>
            <input type="file" style={styles.fileInput} onChange={handleFileChange} />
            <span style={styles.uploadText}>{selectedFile ? selectedFile.name : 'Upload Your Original Work'}</span>
          </label>
          <button style={styles.trialButton} onClick={handleFreeTrial}>
            Start Free Protection / 開始免費保護
          </button>
        </div>
      </section>

      {/* Main marketing Section */}
      <section style={styles.marketingSection}>
        <h2 style={styles.marketingTitle}>Welcome to SUZOO IP Guard</h2>
        <p style={styles.marketingDesc}>
          Every second counts—someone might be copying your creative ideas right now.<br/>
          每一秒都至關重要，您的創意可能正在被盯上。
        </p>
        <p style={styles.marketingDetail}>
          SUZOO IP Guard uniquely integrates blockchain timestamps and AI fingerprint technology for robust, court-admissible originality proof. Our platform proactively detects infringements globally, empowering instant legal action.<br/>
          SUZOO IP Guard 是全球唯一同時結合區塊鏈時間戳與AI指紋技術，提供具法律效力的原創證明平台，並主動在全球範圍偵測侵權行為，迅速採取法律措施。
        </p>
        <button style={styles.subscribeButton} onClick={handleSubscribe}>
          Start Protection Now / 立即開始保護
        </button>

        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Understand Why "Proof of Originality" is Essential (點此展開)
          </summary>
          <div style={styles.expandContent}>
            <p>
              International copyright laws demand concrete proof of originality for legal protection. Traditional methods fall short by only detecting text plagiarism. SUZOO IP Guard revolutionizes protection with immutable blockchain and sophisticated AI, ensuring every detail of your creativity is legally shielded.<br/>
              根據國際著作權法，必須具備具體原創證明才能有效保護著作權，傳統方法僅能偵測文字抄襲。SUZOO IP Guard 透過區塊鏈和AI技術全面升級保障，使您的每一項創意細節都得到完整的法律防護。
            </p>
            <ul style={styles.bulletList}>
              <li>🔗 Immutable Blockchain Proof: Unchangeable timestamps and hash values.</li>
              <li>🤖 AI-driven Infringement Detection: Automatic scanning 24/7.</li>
              <li>🌐 Instant Global Legal Action: Quick initiation of DMCA and legal processes.</li>
              <li>⚙️ One-click Protection: Covers videos, images, texts, and audio.</li>
            </ul>
            <p style={styles.highlight}>
              Act now—secure your creative rights today with unparalleled blockchain-AI protection.<br/>
              立即行動，用前所未有的區塊鏈與AI防護固守您的創作權益。
            </p>
          </div>
        </details>
      </section>

      {/* Footer Section */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          Epic Global International Co., Ltd.<br/>
          Headquarters: 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          Banqiao Office: No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          Contact: +886 900-296-168 (GM Zack Yao)
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0f17', color: '#f5faff', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' },
  heroSection: { textAlign: 'center', padding: '2rem', background: '#12181f', borderRadius: '12px', boxShadow: '0 8px 24px rgba(255,87,34,0.4)' },
  heroTitle: { color: '#FF5722', fontSize: '2rem' },
  heroSubTitle: { color: '#c7d2da', fontSize: '1rem', margin: '1rem 0' },
  uploadRow: { display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' },
  uploadLabel: { background: '#1e1e1e', padding: '0.7rem', borderRadius: '6px', cursor: 'pointer' },
  fileInput: { display: 'none' },
  uploadText: { color: '#ccc' },
  trialButton: { backgroundColor: '#FF5722', color: '#fff', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer' },
  marketingSection: { background: '#161d27', padding: '2rem', borderRadius: '10px', marginTop: '2rem' },
  marketingTitle: { color: '#FF5722', fontSize: '1.8rem' },
  marketingDesc: { color: '#eceff1', margin: '1rem 0' },
  marketingDetail: { color: '#ccc', marginBottom: '1rem' },
  subscribeButton: { backgroundColor: '#ff6f00', color: '#fff', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer' },
  expandBox: { background: '#12181f', borderRadius: '8px', padding: '1rem', marginTop: '1rem' },
  expandSummary: { color: '#FF5722', cursor: 'pointer' },
  bulletList: { color: '#ccc', marginLeft: '1.5rem' },
  highlight: { color: '#ffd54f', marginTop: '1rem' },
  footer: { textAlign: 'center', marginTop: '2rem', color: '#b0bec5' },
  footerDivider: { width: '50%', margin: 'auto', borderColor: '#FF5722' },
  footerText: { fontSize: '0.9rem' },
  marketingHeader: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' },
  logo: { height: '50px' }
};
