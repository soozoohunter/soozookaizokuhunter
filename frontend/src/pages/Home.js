// src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>

      {/* 只有一個大紅框 */}
      <div style={styles.banner}>
        {/* 第一行：改為您要的標題 */}
        <h1 style={styles.mainTitle}>
          世界首創一站式著作權上鏈證明原創 + 侵權偵測
        </h1>

        {/* 底下描述文字：介紹文 */}
        <p style={styles.desc}>
          您想為自己的作品（短影音、商品照片、文字或圖像）進行嚴謹且快速的智慧財產權保護嗎？<br />
          本系統結合區塊鏈技術，能為每部短影音產生「動態指紋」(Fingerprint) 與可驗證的 SHA 雜湊，
          為商品照片產生「靜態指紋」，有效建立原創 DNA 記錄。<br /><br />

          <strong>在發現侵權</strong>時，我們的自動化侵權偵測會主動通知您，並可在 24 小時內提出
          <em>DMCA</em> 申訴，協助讓侵權品迅速下架消失。<br />
          同時，我們也提供 <strong>一站式商標申請、檢索與維權</strong> 服務，協助您輕鬆掌握商標登記狀況，
          避免商標延展時的繁複作業與隱性風險。<br /><br />

          這套「世界首創一站式著作權上鏈證明原創 + 侵權偵測」平台，
          不僅能牢固地保護您的智慧財產，還能大幅縮短處理時間，
          讓您專注於創作與品牌經營，<strong>我們在背後 24 小時為您守護。</strong>
        </p>

        {/* 行動按鈕：連到 /pricing 或其他路由 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          了解服務方案
        </button>
      </div>
    </div>
  );
}

// 內嵌樣式
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
