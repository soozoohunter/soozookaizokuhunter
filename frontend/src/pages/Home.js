// src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.banner}>

        {/* 主標題：世界首創 + 台灣唯一 */}
        <h1 style={styles.mainTitle}>世界首創 🇹🇼 台灣唯一 區塊鏈智慧財產權保護平台</h1>

        {/* 中文介紹文字（仍具衝擊力，但可再依需求微調） */}
        <p style={styles.desc}>
          是否擔心自己的原創作品被盜用、抄襲，卻苦無有效的保護手段？
          我們結合區塊鏈技術與人工智慧侵權爬蟲，
          <strong> 24 小時 </strong>全天候掃描全球網路，
          隨時鎖定任何侵權行為，讓盜用者無所遁形，
          迅速發動<em>DMCA</em>等法律訴訟，
          <strong> 捍衛您的智慧財產權並消滅侵權源頭</strong>！<br /><br />

          我們是<strong>智慧財產權的守護者</strong>，
          為您的短影音、圖片、文字、商標等，
          生成區塊鏈動態或靜態指紋（Fingerprint），
          依托<strong>全方位著作權/商標法律支援與商標申請服務</strong>，
          讓您的創作、品牌、專利無懈可擊。
          在<strong>短短 24 小時</strong>內，即可快速發動行動，
          使侵權品於市場上立即下架！<br /><br />
        </p>

        {/* 英文介紹文字：強調全球守護 */}
        <p style={styles.desc}>
          Worried about your original creations being copied or plagiarized? 
          Our platform seamlessly integrates <strong>blockchain</strong> technology 
          and <strong>AI-powered infringement crawlers</strong> to globally scan 
          for unauthorized usage <em>24/7</em>. 
          We swiftly launch <em>DMCA</em> takedowns and legal measures 
          to secure your intellectual property without mercy to infringers.
          <br /><br />

          We stand as the <strong>guardians of IP</strong>, 
          providing a unique dynamic or static blockchain fingerprint 
          for each video, image, text, and trademark. 
          Coupled with robust <strong>copyright/trademark legal support</strong> 
          and trademark filing services, we ensure your creations and brand 
          remain untouchable. In as little as <strong>24 hours</strong>, 
          infringing content is removed from the market—
          giving you peace of mind and global protection.
        </p>

        {/* 紀念文字 */}
        <p style={styles.memorialText}>
          為紀念我最深愛的曾李素珠奶奶<br/>
          In memory of my beloved grandmother Tseng Li Su-Chu,<br />
          thank you for your endless love and support.
        </p>

        {/* CTA 按鈕：前往 Pricing 方案介紹 */}
        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          了解服務方案 / Learn More
        </button>

        {/* 公司資訊 (中英並列) */}
        <div style={styles.companyInfo}>
          <hr style={styles.divider} />
          <p style={styles.companyText}>
            <strong>🇹🇼凱盾全球國際股份有限公司</strong><br/>
            (Epic Global International Co., Ltd.)<br/><br/>

            <strong>總公司 (Headquarters):</strong>1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br/>
            <strong>辦公室 (Office):</strong> No. 3, Lane 36, Lane 153, Section 2, Sanmin Road, Banqiao District, New Taipei City<br/>
            <strong>聯絡電話 (Contact):</strong> +886 900-296-168  GM Zack Yao
          </p>
        </div>
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
  },
  companyInfo: {
    marginTop: '2rem',
    textAlign: 'center'
  },
  divider: {
    margin: '1rem auto',
    width: '70%',
    border: '1px solid #f00'
  },
  companyText: {
    fontSize: '0.9rem',
    color: '#ccc',
    lineHeight: '1.4'
  }
};
