import React from 'react';

// ★ 示範 CSS-in-JS, 包含簡單的 blink 動畫
export default function Home() {
  return (
    <div style={styles.outer}>
      {/* Banner 區塊 */}
      <div style={styles.banner}>
        {/* 標題 (使用同一行, 加上動畫效果) */}
        <h1 style={styles.mainTitle}>
          速誅 SUZOO! 侵權獵人系統
        </h1>
      </div>

      {/* 第二段標題/介紹 */}
      <div style={styles.subSection}>
        <h2 style={styles.subHeader}>速誅SUZOO! Copyright Hunter System</h2>
        <p style={styles.paragraph}>
          以 DC-DV（動態著作DNA辨識）與 SC-DV（靜態著作DNA辨識）為核心，結合區塊鏈 + AI，  
          為您的創作提供全自動維權！  
        </p>
      </div>
    </div>
  );
}

const blinkAnim = {
  animation: 'blinkAnim 1.6s infinite',
  // 也可用 animationTimingFunction, animationDirection, etc. 看需求
};

const styles = {
  outer: {
    maxWidth: '960px',
    margin: '2rem auto',
    padding: '0 1rem',
    color: '#fff'
  },
  banner: {
    border: '2px solid #f00',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#1a1a1a'
  },
  mainTitle: {
    fontSize: '3rem',
    color: 'orange',
    margin: 0,
    // ★ 閃爍動畫
    ...blinkAnim,
  },
  subSection: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#000'
  },
  subHeader: {
    fontSize: '2rem',
    color: 'orange',
    marginBottom: '0.5rem'
  },
  paragraph: {
    lineHeight: '1.6',
    fontSize: '1.1rem',
    color: '#fff'
  }
};

/* ★ CSS keyframes:
   因為我們在 React inline style 內無法直接定義keyframes，
   通常可搭配 styled-components、CSS檔 或 useEffect動態注入style。
   這裡示範最簡單做法：在public/index.html內加上:
   
   <style>
   @keyframes blinkAnim {
     0% { opacity: 1; }
     50% { opacity: 0.4; }
     100% { opacity: 1; }
   }
   </style>
   
   亦或使用 styled-components / emotion 來定義 keyframes。
*/
