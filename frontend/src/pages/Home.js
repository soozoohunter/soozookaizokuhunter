import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>

      {/* ====== 第一個紅框：保留頂部標題 ====== */}
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>SUZOO Intellectual Property Infringement Detection System </h1>
      </div>

      {/* ====== 第二個紅框：添加您給的介紹文字 ====== */}
      <div style={styles.introBox}>
        {/* 建議把文字分段或用 <p>、<div>、<br/> 來排版 */}
        
        <p style={styles.paragraph}>
          <strong style={styles.strong}>🔥 DCDV（動態著作 DNA 辨識，Dynamic Content DNA Verification）🔥</strong><br/>
          <span style={styles.bullet}>🔹</span> 你的短影音 = 你的 DNA，每一秒畫面都是你的智慧財產<br/>
          <span style={styles.bullet}>🔹</span> 透過 區塊鏈技術 + AI 指紋辨識，即使被裁剪、變速、加字幕，仍能 100% 精準比對<br/>
        </p>

        <p style={styles.paragraph}>
          <strong style={styles.strong}>🔥 SCDV（靜態著作 DNA 辨識，Static Content DNA Verification）🔥</strong><br/>
          <span style={styles.bullet}>🔹</span> 圖片、插畫、攝影作品，擁有專屬的著作 DNA<br/>
          <span style={styles.bullet}>🔹</span> AI 圖片指紋比對技術，確保你的作品不被盜用<br/>
          <span style={styles.bullet}>🔹</span> 企業 API 整合，品牌、攝影師可一鍵監測未授權使用<br/>
        </p>

        <p style={styles.paragraph}>
          <strong style={styles.strong}>🔥 侵權通知（智慧警報系統）🔥</strong><br/>
          <span style={styles.bullet}>🔹</span> 你的作品被偷了？第一時間通知你<br/>
          <span style={styles.bullet}>🔹</span> 自動提交 DMCA 申訴，讓盜版內容 24 小時內下架<br/>
          <span style={styles.bullet}>🔹</span> 不用花時間檢舉，系統全自動幫你維權<br/>
        </p>

        <p style={styles.paragraph}>
          <strong style={styles.strong}>🔥 區塊鏈存證（ETH 私有鏈）🔥</strong><br/>
          <span style={styles.bullet}>🔹</span> 你的創作，將擁有不可篡改的證據<br/>
          <span style={styles.bullet}>🔹</span> 影片、圖片、圖文，都能被存證於區塊鏈，確保歸屬<br/>
        </p>

        <p style={styles.paragraph}>
          <strong style={styles.strong}>🔥 企業 API 服務（侵權監測 / DMCA 自動申訴）🔥</strong><br/>
          <span style={styles.bullet}>🔹</span> 給企業級客戶專屬的智能內容監測工具<br/>
          <span style={styles.bullet}>🔹</span> 可批量監測品牌內容的未授權使用<br/>
          <span style={styles.bullet}>🔹</span> 讓企業在數位時代，輕鬆維護智慧財產權<br/>
        </p>

        <p style={styles.paragraph}>
          <strong style={styles.strong}>⚖️ 訴訟機制 ⚖️</strong><br/>
          <span style={styles.bullet}>🔹</span> 侵權通報後，還能直接發起訴訟，讓侵權者付出代價！<br/>
          <span style={styles.bullet}>🔹</span> SUZOO 提供法律支援，協助平台會員對盜用者直接提起侵權訴訟<br/>
        </p>
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
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem'
  },
  /* 第一個紅框 */
  banner: {
    border: '2px solid #f00',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    background: 'rgba(255,28,28,0.06)',
    width: '100%',
    maxWidth: '1000px'
  },
  mainTitle: {
    fontSize: '3rem',
    margin: 0,
    color: 'orange'
  },
  /* 第二個紅框 */
  introBox: {
    border: '2px solid #f00',
    borderRadius: '8px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '1000px',
    background: 'rgba(255,28,28,0.06)',
  },
  paragraph: {
    color: '#fff',
    fontSize: '1rem',
    lineHeight: '1.7',
    marginBottom: '1rem'
  },
  strong: {
    color: 'orange'
  },
  bullet: {
    marginRight:'4px'
  }
};
