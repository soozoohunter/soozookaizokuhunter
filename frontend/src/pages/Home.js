import React from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.banner}>
        <h1 style={styles.mainTitle}>世界首創 🇹🇼 區塊鏈智慧財產權即時保護平台</h1>
        <p style={styles.desc}>
          您的原創作品是否飽受抄襲與侵權困擾？我們結合
          <strong>區塊鏈動態指紋技術</strong>與
          <strong>AI 智慧侵權爬蟲</strong>，
          24 小時自動掃描全球網路，協助您快速鎖定侵權者並啟動 DMCA 申訴，
          全面守護您的著作權與商標權。<br/><br/>

          <strong>臺灣著作權法</strong>：若無法證明作品「原創性」，法院可能判定著作權不成立。
          我們於註冊時將您的社群 / 電商帳號一併
          <em>寫入區塊鏈</em>，作為「原創性」証明基礎；未來一旦發生侵權爭議，即可迅速引用不可竄改的鏈上紀錄，成功維權。
        </p>

        <button
          onClick={() => window.location.href='/pricing'}
          style={styles.enterBtn}
        >
          查看保護方案 / Explore Plans
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
    margin:0,
    padding:'3rem',
    fontFamily:'Roboto, sans-serif'
  },
  banner: {
    border:'2px solid #ff6f00',
    borderRadius:'8px',
    padding:'2.5rem',
    background:'#161b22',
    textAlign:'center'
  },
  mainTitle: {
    fontSize:'2.4rem',
    fontWeight:'bold',
    marginBottom:'1.5rem',
    color:'#ff6f00'
  },
  desc: {
    fontSize:'1rem',
    lineHeight:'1.8',
    color:'#e0e0e0',
    margin:'1.5rem 0'
  },
  enterBtn: {
    backgroundColor:'#ff6f00',
    color:'#fff',
    border:'none',
    borderRadius:'6px',
    padding:'0.75rem 1.5rem',
    cursor:'pointer',
    fontSize:'1rem'
  },
  companyInfo: {
    marginTop:'2rem'
  },
  divider: {
    margin:'1rem auto',
    width:'70%',
    border:'1px solid #ff6f00'
  },
  companyText: {
    fontSize:'0.9rem',
    color:'#8b949e',
    lineHeight:'1.6'
  }
};
