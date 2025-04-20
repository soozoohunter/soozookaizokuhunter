import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.banner}>

        {/* 主標題 */}
        <h1 style={styles.mainTitle}>
          {/* 若想分行可用 <br/> */}
          First in Taiwan: Blockchain-powered<br/>IP Rights Protection
        </h1>

        {/* 英文介紹文字 (先) */}
        <p style={styles.desc}>
          Tired of copyright infringement? <br/>
          Our pioneering platform harnesses <strong>Blockchain Dynamic Fingerprinting</strong>
          and <strong>AI-driven infringement detection</strong> to monitor the web <em>24/7</em>,
          swiftly initiating DMCA actions and providing robust legal protection.
          <br/><br/>
          Whether it's videos, images, text, or trademarks,
          we instantly generate blockchain-certified originality proofs,
          removing infringing content from marketplaces within <strong>24 hours</strong>—
          ensuring unbeatable global IP defense.
        </p>

        {/* 中文介紹文字 (後) */}
        <p style={styles.desc}>
          您是否飽受抄襲與侵權之苦？<br/>
          我們結合<strong>區塊鏈動態指紋技術</strong>與
          <strong>AI 智慧侵權爬蟲</strong>，
          全天候<em>24小時監測全球網路</em>，
          迅速鎖定侵權行為並啟動 DMCA 法律程序，
          <strong>全面守護您的著作權與商標權</strong>。<br/><br/>

          無論是短影音、圖片、文字或品牌商標，
          我們皆能即時建立不可竄改的區塊鏈原創證明，
          結合強大的法律資源，
          在 <strong>24 小時內</strong> 強制移除侵權內容，
          為您的智慧財產權提供全方位保障。
        </p>

        {/* 紀念文字 */}
        <p style={styles.memorialText}>
          In memory of my beloved grandmother, Tseng Li Su-Chu.<br/>
          為紀念我最深愛的 曾李素珠 阿嬤。<br/>
          Thank you for your endless love and inspiration.
        </p>

        {/* CTA 按鈕 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          Explore Plans / 查看保護方案
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
