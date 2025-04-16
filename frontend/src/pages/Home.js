// src/pages/Home.js (完整優化文案及UI)
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.banner}>

        {/* 主標題 */}
        <h1 style={styles.mainTitle}>世界首創 🇹🇼 從臺灣出發<br/>區塊鏈智慧財產權即時保護平台</h1>

        {/* 中文介紹文字 */}
        <p style={styles.desc}>
          您的原創作品是否飽受抄襲與侵權困擾？<br/>
          我們透過<strong>區塊鏈動態指紋技術與AI智慧侵權爬蟲</strong>，
          全天候<em>24小時即時監測全球網路</em>，
          迅速鎖定侵權行為，並啟動DMCA法律程序，
          <strong>全面守護您的著作權與商標權。</strong><br/><br/>

          無論是短影音、圖片、文字或品牌商標，
          我們皆能即刻建立不可篡改的區塊鏈原創證明，
          結合強大的法律資源與支援，
          在<strong>24小時內</strong>，迅速將侵權作品下架，
          全方位保障您的智慧財產權。
        </p>

        {/* 英文介紹文字 */}
        <p style={styles.desc}>
          Tired of copyright infringement? <br/>
          Our pioneering platform uses <strong>Blockchain Dynamic Fingerprinting</strong> and
          <strong>AI-driven infringement detection</strong> to monitor the web <em>24/7</em>,
          swiftly initiating DMCA actions and providing robust legal protection.
          <br/><br/>
          Whether it's videos, images, text, or trademarks,
          we instantly generate blockchain-certified originality proofs,
          removing infringing content from markets within <strong>24 hours</strong>—
          ensuring unbeatable global IP protection.
        </p>

        {/* 紀念文字 */}
        <p style={styles.memorialText}>
          為紀念我最深愛的曾李素珠奶奶<br/>
          In memory of my beloved grandmother Tseng Li Su-Chu,<br />
          Thank you for your endless love and inspiration.
        </p>

        {/* CTA 按鈕 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          查看保護方案 / Explore Plans
        </button>

        {/* 公司資訊 */}
        <div style={styles.companyInfo}>
          <hr style={styles.divider} />
          <p style={styles.companyText}>
            <strong>🇹🇼Epic Global International Co., Ltd.</strong><br/>
            凱盾全球國際股份有限公司<br/><br/>

            <strong>Headquarters:</strong> 1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br/>
            <strong>Taipei Office:</strong> No. 3, Lane 36, Lane 153, Section 2, Sanmin Road, Banqiao District, New Taipei City<br/>
            <strong>Contact:</strong> +886 900-296-168 GM Zack Yao
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    margin: 0,
    padding: '3rem',
    fontFamily: 'Roboto, sans-serif'
  },
  banner: {
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '2.5rem',
    background: '#161b22',
    textAlign: 'center'
  },
  mainTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#ff6f00'
  },
  desc: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#e0e0e0',
    margin: '1.5rem 0'
  },
  memorialText: {
    fontSize: '0.9rem',
    color: '#8b949e',
    marginTop: '2rem',
    fontStyle: 'italic'
  },
  enterBtn: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1.5rem'
  },
  companyInfo: {
    marginTop: '2rem'
  },
  divider: {
    margin: '1rem auto',
    width: '70%',
    border: '1px solid #ff6f00'
  },
  companyText: {
    fontSize: '0.9rem',
    color: '#8b949e',
    lineHeight: '1.6'
  }
};
