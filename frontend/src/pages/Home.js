// src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* 主視覺區塊 */}
      <div style={styles.banner}>
        {/* 主標題 */}
        <h1 style={styles.mainTitle}>
          世界首創區塊鏈智慧財產權保護平台
        </h1>

        {/* 中文介紹文字 */}
        <p style={styles.desc}>
          您是否曾經擔心作品遭到抄襲或侵權？我們運用區塊鏈技術，
          為每個短影音、圖片、文字或圖像作品生成獨特且可驗證的
          <strong>動態或靜態指紋（Fingerprint）</strong>，
          確保您的原創能夠被完整證明，全球獨家，台灣唯一！<br /><br />

          本平台的<strong>智慧財產權保護鏈</strong>，不僅能立即確認作品原創性，更能透過全自動侵權偵測，
          在發現未經授權使用作品時，主動通知您並於 24 小時內迅速發動
          <em>DMCA</em> 下架申訴，確保侵權品快速消失於市場。
          我們將成為您的著作權、商標權與侵權的全方位智慧財產權守門員，更是侵權者的獵人，
          徹底守護您的創作與品牌。<br /><br />

          此外，我們提供完整的一站式商標服務，包括商標申請、檢索、延展、核准答辯與駁回答辯文撰寫，
          以及智慧財產權訴訟服務（著作權、商標權、清權訴訟）。讓我們透過區塊鏈技術與專業法務團隊，
          <strong>24 小時為您把關！</strong>
        </p>

        {/* 英文介紹文字 */}
        <p style={styles.desc}>
          Have you ever worried about your creations being plagiarized or infringed?
          Our innovative blockchain technology generates a unique and verifiable 
          <strong> dynamic or static fingerprint </strong>
          for every video, image, text, or graphic, ensuring your originality 
          is indisputably proven—globally exclusive, the only one in Taiwan!
          <br /><br />

          Our <strong>Intellectual Property Protection Chain</strong> instantly verifies originality
          and employs fully automated infringement detection. Once unauthorized usage is detected,
          you’ll be notified immediately, and we swiftly initiate a <em>DMCA</em> takedown within 24 hours, 
          ensuring infringing content vanishes rapidly from the market. We serve as your comprehensive 
          gatekeeper for copyrights, trademarks, and infringement—fearlessly hunting down violators 
          to protect your creativity and brand.
          <br /><br />

          Additionally, we offer end-to-end trademark services—from application and searches 
          to renewals and legal defenses—as well as full-scale IP litigation (copyrights, trademarks,
          and clearance). Let our blockchain expertise and professional legal team safeguard 
          your creative works and brand value—
          <strong> 24-hour protection at your service!</strong>
        </p>

        {/* 紀念文字 */}
        <p style={styles.memorialText}>
          為紀念我最深愛的曾李素珠奶奶，感謝您無盡的愛與支持<br/>
          In memory of my beloved grandmother Tseng Li Su-Chu, thank you for your endless love and support.
        </p>

        {/* 按鈕：連到定價 / 方案頁面 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          了解服務方案 / Learn More
        </button>
      </div>
    </div>
  );
}

// 內嵌樣式設定
const styles = {
  container: {
    backgroundColor: '#000',
    color: '#ff1c1c',
    minHeight: '100vh',
    margin: 0,
    padding: '2rem',
    fontFamily: 'sans-serif'
  },
  banner: {
    border: '2px solid #f00',
    borderRadius: '8px',
    padding: '2rem',
    background: 'rgba(255,28,28,0.06)',
    textAlign: 'center'
  },
  mainTitle: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '1rem',
    color: 'orange'
  },
  desc: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#fff',
    margin: '1rem 0'
  },
  memorialText: {
    fontSize: '0.9rem',
    color: '#ccc',
    marginTop: '2rem',
    fontStyle: 'italic'
  },
  enterBtn: {
    backgroundColor: 'orange',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  }
};
