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
      {/* Unified Hero + Upload */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>
          THE WORLD'S ONLY Blockchain & AI-Powered Originality Proof Platform
        </h1>
        <p style={styles.heroSubTitle}>
          我們是唯一透過區塊鏈上鏈＋AI技術生成動靜態指紋的原創證明平台，24/7 全天候AI侵權偵測並啟動全球法律行動。
        </p>
        <div style={styles.heroFeatures}>
          <div style={styles.featureItem}>
            <strong>📽 動態指紋 (影片)</strong><br/>
            AI Hashing for dynamic video fingerprinting
          </div>
          <div style={styles.featureItem}>
            <strong>🖼 靜態指紋 (圖片)</strong><br/>
            固定哈希值為圖像生成不可篡改證據
          </div>
          <div style={styles.featureItem}>
            <strong>⏱ 24/7 侵權偵測</strong><br/>
            全天候掃描未經授權重製與散佈
          </div>
        </div>
        {/* Enhanced detail paragraph */}
        <p style={styles.heroDetail}>
          【EN】Anchor your copyright with immutable blockchain timestamps and AI fingerprint modules—ensuring tamper-proof evidence<br/>
          【繁中】透過區塊鏈時間戳與AI指紋模組，為您的影音與圖像創作提供無可爭議的法庭級證據。
        </p>
        {/* File upload + trial */}
        <div style={styles.uploadRow}>
          <label style={styles.uploadLabel}>
            <input type="file" style={styles.fileInput} onChange={handleFileChange} />
            <span style={styles.uploadText}>{selectedFile ? selectedFile.name : 'Select File'}</span>
          </label>
          <button style={styles.trialButton} onClick={handleFreeTrial}>
            Free Trial / 免費試用
          </button>
        </div>
      </section>

      {/* Marketing & Subscribe */}
      <section style={styles.marketingSection}>
        <div style={styles.marketingHeader}>
          <img src="/logo0.jpg" alt="SUZOO Logo" style={styles.logo} />
          <h2 style={styles.marketingTitle}>Welcome to SUZOO IP Guard</h2>
        </div>
        <p style={styles.marketingDesc}>
          Every second counts—立即部署世界首創的AI+Blockchain智慧財產防護，捍衛您的創作價值。
        </p>
        {/* Additional marketing copy */}
        <p style={styles.marketingDetail}>
          Only SUZOO IP Guard offers on-chain proofing with AI-driven fingerprinting for both video and image works, complemented by an elite legal network ready to act in minutes. 保護您的智慧財產，免於任何侵權威脅。
        </p>
        {/* Subscribe CTA */}
        <button style={styles.subscribeButton} onClick={handleSubscribe}>
          Start Protection Now / 立即開始保護
        </button>

        <details style={styles.expandBox}>
          <summary style={styles.expandSummary}>
            Why Proof of Originality Matters (點此展開)
          </summary>
          <div style={styles.expandContent}>
            <p>
              【EN】Only SUZOO IP Guard leverages blockchain timestamps and AI fingerprinting to generate tamper-proof evidence for video and image works. Without robust proof, you risk losing your rights in any jurisdiction.
            </p>
            <p>
              【繁中】僅有我們同時支援「動態指紋」與「靜態指紋」，並全天候AI侵權偵測，讓您的原創作品具備最完整的法律防護。
            </p>
            <ul style={styles.bulletList}>
              <li>🔗 區塊鏈上鏈：時間戳與哈希值永久不可篡改</li>
              <li>🤖 AI偵測：7x24 小時自動掃描全球未授權使用</li>
              <li>🌐 全球法律行動：瞬時啟動 DMCA 及司法程序</li>
              <li>⚙️ 一鍵部署：適用於影片、圖片、文字、音訊等所有創作類型</li>
            </ul>
            <p style={styles.highlight}>
              Secure your IP with the world’s first and only blockchain-AI proof platform. 立即行動，固守您的創作權益！
            </p>
          </div>
        </details>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <hr style={styles.footerDivider} />
        <p style={styles.footerText}>
          🇹🇼 Epic Global International Co., Ltd.<br/>
          Headquarters: 1F, No.5, Lane 40, Taishun St, Da’an Dist, Taipei City<br/>
          Banqiao Office: No.3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br/>
          Contact: +886 900-296-168
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0f17', color: '#f5faff', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' },
  heroSection: { maxWidth: '1000px', margin: 'auto', padding: '2rem', background: '#12181f', borderRadius: '12px', boxShadow: '0 8px 24px rgba(255,87,34,0.4)' },
  heroTitle: { fontSize: '2.5rem', color: '#FF5722', textAlign: 'center', marginBottom: '1rem' },
  heroSubTitle: { fontSize: '1rem', color: '#c7d2da', textAlign: 'center', marginBottom: '1.5rem' },
  heroFeatures: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginBottom: '1rem' },
  featureItem: { flex: '1 1 30%', textAlign: 'center', fontSize: '0.9rem', color: '#eceff1', margin: '0.5rem' },
  heroDetail: { fontSize: '0.95rem', color: '#ccc', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.6' },
  uploadRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' },
  uploadLabel: { display: 'flex', alignItems: 'center', background: '#1e1e1e', border: '1px solid #444', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer' },
  fileInput: { display: 'none' },
  uploadText: { color: '#ccc', fontSize: '0.9rem' },
  trialButton: { backgroundColor: '#FF5722', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.6rem 1.2rem', fontWeight: 600, cursor: 'pointer' },
  marketingSection: { maxWidth: '900px', margin: '2rem auto', background: '#161d27', padding: '2rem', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.6)' },
  marketingHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' },
  logo: { height: '3rem' },
  marketingTitle: { color: '#FF5722', fontSize: '1.8rem', margin: 0 },
  marketingDesc: { fontSize: '1rem', color: '#eceff1', textAlign: 'center', lineHeight: '1.6', marginBottom: '1rem' },
  marketingDetail: { fontSize: '0.95rem', color: '#ccc', textAlign: 'center', lineHeight: '1.6', marginBottom: '1.5rem' },
  subscribeButton: { backgroundColor: '#ff6f00', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.6rem 1.4rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'block', margin: '0 auto 1rem' },
  expandBox: { background: '#12181f', border: '1px solid #ff6f00', borderRadius: '6px', padding: '1rem', color: '#ccc' },
  expandSummary: { color: '#ff6f00', fontWeight: 600, cursor: 'pointer' },
  expandContent: { marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.6' },
  bulletList: { marginTop: '1rem', paddingLeft: '1.2rem', color: '#ddd' },
  highlight: { marginTop: '1rem', color: '#ffd54f', fontWeight: 600 },
  footer: { textAlign: 'center', padding: '1rem', marginTop: 'auto' },
  footerDivider: { width: '60%', margin: '1rem auto', borderColor: '#FF5722' },
  footerText: { fontSize: '0.9rem', color: '#b0bec5', lineHeight: '1.6' }
};
