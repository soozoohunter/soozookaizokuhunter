// frontend/src/pages/Home.js
import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* ===== Banner / Hero 區域 ===== */}
      <div style={styles.banner}>
        {/* === 1) 主標 + 副標各自一行 === */}
        <h1 style={styles.shortTitle}>BLOCKCHAIN + AI = FLAWLESS COPYRIGHT PROTECTION</h1>
        <p style={styles.subTitle}>ONE CLICK TO PROVE YOUR ORIGINALITY.</p>
        
        {/* 2) 介紹段落 */}
        <p style={styles.desc}>
          We are a proudly Taiwanese (台灣) 🇹🇼 platform dedicated to solving the world's toughest copyright disputes. 
          <br /><br />
          Under modern copyright law, <strong>Originality</strong> is the key.
          Failing to prove your creation time and independence often means losing everything in court—
          even if you truly created it first.
          <br /><br />
          <strong>ONLY WE</strong> combine unstoppable <strong>Blockchain Fingerprinting</strong>
          with advanced <strong>AI Infringement Detection</strong> and global legal solutions.
          <br /><br />
          <strong>No more guesswork, no more hidden copying:</strong>
          once you're on our chain, your authorship is unassailable,
          recognized by courts worldwide, and protected from any unauthorized use.
        </p>

        {/* 主要行動按鈕：Pricing */}
        <button
          onClick={() => window.location.href = '/pricing'}
          style={styles.enterBtn}
        >
          Get Protected Now / 立即保護你的著作
        </button>

        {/* 次要行動按鈕：Protect Step1 */}
        <button
          onClick={() => window.location.href = '/protect/step1'}
          style={{ ...styles.enterBtn, marginLeft: '1rem' }}
        >
          PROTECT NOW
        </button>

        {/* 公司資訊 */}
        <div style={styles.companyInfo}>
          <hr style={styles.divider} />
          <p style={styles.companyText}>
            <strong>Epic Global International Co., Ltd.</strong><br />
            🇹🇼凱盾全球國際股份有限公司<br /><br />
            <strong>Headquarters:</strong> 1F, No. 5, Lane 40, Taishun Street, Da'an District, Taipei City<br />
            <strong>Taipei Office:</strong> No. 3, Lane 36, Ln.153, Sec.2, Sanmin Rd, Banqiao, New Taipei City<br />
            <strong>Contact:</strong> +886 900-296-168 (GM Zack Yao)
          </p>
        </div>
      </div>

      {/* ===== 行銷文案 / Supplement 區域 ===== */}
      <div style={styles.addonSection}>
        <h2 style={styles.welcomeTitle}>Welcome to SUZOO IP Guard 🚀</h2>
        <p style={styles.addonDesc}>
          Every second counts—someone might be stealing your ideas right now! <br />
          Protect your Copyright &amp; Infringement claims with unstoppable evidence.
        </p>

        <details style={styles.legalBlock}>
          <summary style={{ cursor: 'pointer', color: '#FF5722', marginBottom: '1rem' }}>
            Understand Why "Originality" Matters (點此展開)
          </summary>
          <div style={{ marginTop: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p>
              【繁中】根據台灣與國際著作權法，「原創性」是判斷是否享有著作權保護的關鍵。
              只要是 <strong>獨立完成</strong> 的創作，即使與他人作品雷同，也可能受保護；
              但若不能證明獨立完成，將面臨抄襲、侵權的風險。
            </p>
            <p>
              不論是攝影、美術、文本、程式碼，只要在完成之際無法舉證原創，
              <strong>法院就可能認定著作權不成立</strong>。
              這也是為什麼我們強調
              <strong>區塊鏈+AI雙重保障</strong>的重要性——
              一次上鏈，終身保護，AI 即時比對潛在侵權。
            </p>
            <p style={{ marginTop: '1rem' }}>
              <strong>【EN】</strong>
              Copyright law revolves around proving independent creation.
              If you can't show that your work is truly original, you risk losing all claims.
              Our system locks your proof onto the blockchain at the moment of creation,
              ensuring no one can challenge your authorship or time of completion.
            </p>
            <p style={{ marginTop: '1rem', color: '#ffd54f', fontWeight: '600' }}>
              Join us and never lose a copyright dispute again!
            </p>
          </div>
        </details>

        <p style={styles.extraMarketing}>
          <strong>我們是世界唯一！</strong> 只有我們能將「區塊鏈著作權證明」與「AI侵權偵測」結合，
          完美解決著作權法中「原創性」的舉證難題。下好離手，馬上上鏈！
        </p>
      </div>
    </div>
  );
}

/** ========== Styles ========== */
const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    padding: '4rem',
    fontFamily: 'Inter, sans-serif'
  },
  banner: {
    border: '3px solid #FF5722',
    borderRadius: '12px',
    padding: '3rem',
    background: '#12181f',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(255,87,34,0.4)'
  },
  shortTitle: {
    fontSize: '1.9rem',
    fontWeight: 'bold',
    color: '#FF5722',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
  },
  subTitle: {
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    color: '#ffd700',
    marginBottom: '1.5rem'
  },
  desc: {
    fontSize: '1.05rem',
    lineHeight: '1.9',
    color: '#c7d2da',
    marginBottom: '2rem'
  },
  enterBtn: {
    backgroundColor: '#FF5722',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'transform 0.2s'
  },
  companyInfo: {
    marginTop: '2.5rem'
  },
  divider: {
    margin: '2rem auto',
    width: '60%',
    border: '1px solid #FF5722'
  },
  companyText: {
    fontSize: '0.95rem',
    color: '#b0bec5',
    lineHeight: '1.7'
  },
  addonSection: {
    marginTop: '3rem',
    padding: '3rem',
    backgroundColor: '#161d27',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    textAlign: 'center'
  },
  welcomeTitle: {
    fontSize: '2rem',
    color: '#FF5722',
    marginBottom: '1.2rem',
    fontWeight: '700'
  },
  addonDesc: {
    fontSize: '1.1rem',
    color: '#eceff1',
    marginBottom: '2rem'
  },
  legalBlock: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#12181f',
    border: '2px solid #FF5722',
    borderRadius: '8px',
    textAlign: 'left'
  },
  extraMarketing: {
    marginTop: '2rem',
    fontSize: '1.2rem',
    color: '#ffd54f',
    fontWeight: '600'
  }
};
