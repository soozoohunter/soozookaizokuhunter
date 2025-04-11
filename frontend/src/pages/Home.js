import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>

      {/* ====== 只有一個大紅框 ====== */}
      <div style={styles.banner}>
        {/* 第一行： 橘色 + 大標題, 後面加 (IP Hunter System) 紅橘色 */}
        <h1 style={styles.mainTitle}>
          速誅 SUZOO! 侵權獵人系統 <span style={styles.subEnglish}>(IP Hunter System)</span>
        </h1>
        
        {/* 底下的描述 */}
        <p style={styles.desc}>
          這裡是您的智慧財產維權平台，
          提供動態短影音與靜態圖像的區塊鏈存證、DMCA 自動申訴、商標監測等服務。<br/>
          請善用上方選單進行「上傳作品」、「會員中心」、「Pricing」或「Contact Us」等操作。
        </p>

        {/* 按鈕 => 引導到 /pricing */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          立即瞭解服務方案
        </button>
      </div>
    </div>
  );
}

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
  subEnglish: {
    color: '#ff6600', // 橘紅色
    fontSize: '1.1rem',
    marginLeft: '8px'
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
