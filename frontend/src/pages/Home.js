import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>
          The World’s First 🇹🇼 Blockchain-Powered IP Protection Platform
        </h1>

        <p style={styles.desc}>
          In today’s digital landscape, protecting your original creations from
          plagiarism and infringement is more crucial than ever. Our platform utilizes
          <strong> advanced blockchain fingerprinting</strong> and
          <strong> AI-powered infringement crawlers</strong>
          to monitor the entire web 24/7. Once an infringing case is detected, we
          instantly initiate DMCA takedown procedures to safeguard your copyrights and trademarks.<br/><br/>

          <strong>Under global copyright laws</strong> — not just in Taiwan —
          it is critical to demonstrate the <em>“originality”</em> of your work.
          If you fail to prove that the content is truly yours, courts worldwide may
          rule that no valid copyright exists. This is why, during registration, we link
          your social media and e-commerce accounts directly on the blockchain,
          creating an immutable record that serves as the foundation of your claim to originality.
          (全球著作權法皆如此，並非僅限台灣。若無法證明作品為「原創」，即使有侵權行為也可能難以勝訴。)
        </p>

        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          Explore Plans / 查看保護方案
        </button>

        <div style={styles.companyInfo}>
          <hr style={styles.divider}/>
          <p style={styles.companyText}>
            <strong>🇹🇼 Epic Global International Co., Ltd.</strong><br/>
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
    fontSize: '2.4rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#ff6f00'
  },
  desc: {
    fontSize: '1rem',
    lineHeight: '1.8',
    color: '#e0e0e0',
    margin: '1.5rem 0'
  },
  enterBtn: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '1rem'
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
