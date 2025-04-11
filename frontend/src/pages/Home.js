import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* 保留此頁面作為“第二個大紅框+介紹文字” */}
      <div style={styles.introBox}>
        <h2 style={styles.title}>🔥 DCDV（動態著作 DNA 辨識）🔥</h2>
        <p style={styles.paragraph}>
          短影音 = 你的 DNA，每一秒都是智慧財產<br/>
          區塊鏈 + AI 指紋辨識，再怎麼裁剪/變速，都能精準比對！
        </p>

        <h2 style={styles.title}>🔥 SCDV（靜態著作 DNA 辨識）🔥</h2>
        <p style={styles.paragraph}>
          圖片、插畫、攝影作品，擁有專屬指紋哈希<br/>
          AI 圖片比對技術，防止未授權盜用<br/>
        </p>

        <h2 style={styles.title}>🔥 侵權通知 & DMCA 自動申訴 🔥</h2>
        <p style={styles.paragraph}>
          發現盜用 → 第一時間通知<br/>
          自動 DMCA，24 小時內下架
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight:'400px',
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
  },
  introBox: {
    border:'2px solid #f00',
    borderRadius:'8px',
    padding:'2rem',
    maxWidth:'800px',
    background:'rgba(255,28,28,0.06)'
  },
  title: {
    color:'orange',
    marginBottom:'0.5rem'
  },
  paragraph: {
    color:'#fff',
    lineHeight:'1.6',
    marginBottom:'1rem'
  }
};
