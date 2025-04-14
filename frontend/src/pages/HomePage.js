// frontend/src/pages/HomePage.js
import React from 'react';

export default function HomePage() {
  // 會員方案 - 價格
  const basicMonthly = 299;
  const basicYearly = 2990;   // 相當於月費*10，省 2 個月
  const advancedMonthly = 699;
  const advancedYearly = 6990; 
  const proMonthly = 999;
  const proYearly = 9990;
  const enterpriseMonthly = 1999;
  const enterpriseYearly = 19990;

  // 商標侵權偵測
  const trademarkMonthly = 999;
  const trademarkYearly = 9990;

  // 點選「立即訂閱 / 付款」按鈕 => 跳轉 payment 頁面 (假設 /payment)
  const goPayment = () => {
    window.location.href = '/payment';
  };

  return (
    <div style={styles.container}>
      {/* 頂部大標題 - 世界首創台灣獨家 */}
      <header style={styles.header}>
        <h1 style={styles.mainTitle}>
          世界首創・台灣獨家
        </h1>
        <h2 style={styles.subTitle}>
          使用區塊鏈來守護您的智慧財產權
        </h2>
      </header>

      {/* 簡介 */}
      <section style={styles.introSection}>
        <p style={styles.introText}>
          我們運用 <strong>區塊鏈 + 24 小時爬蟲偵測</strong>，
          協助您建立「動態 Fingerprint」（短影音）與「靜態 Fingerprint」（商品圖檔）之原創證明，
          任何侵權行為都可在 24 小時內提出 DMCA 申訴，協助您迅速下架侵權品。
        </p>
        <p style={styles.introText}>
          除此之外，我們亦提供「<strong>商標申請 / 檢索 / 維權</strong>」一站式服務，
          整合申請流程與侵權偵測，讓您無需擔心商標延展時的繁雜手續。
        </p>
      </section>

      {/* 會員方案 - Copyright */}
      <section style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2 style={styles.orangeTitle}>著作權保護方案</h2>
        <div style={styles.planContainer}>

          {/* BASIC */}
          <PlanCard
            planName="BASIC"
            priceMonthly={`NT$${basicMonthly}`}
            priceYearly={`NT$${basicYearly}`}
            desc={[
              '首月免費',
              '3部短影音 / 10張圖片',
              '無 DMCA 申訴'
            ]}
          />

          {/* ADVANCED */}
          <PlanCard
            planName="ADVANCED"
            priceMonthly={`NT$${advancedMonthly}`}
            priceYearly={`NT$${advancedYearly}`}
            desc={[
              '10部短影音 / 25張圖片',
              '可使用 DMCA 申訴'
            ]}
          />

          {/* PRO */}
          <PlanCard
            planName="PRO"
            priceMonthly={`NT$${proMonthly}`}
            priceYearly={`NT$${proYearly}`}
            desc={[
              '20部短影音 / 50張圖片',
              '可使用 DMCA 申訴'
            ]}
          />

          {/* ENTERPRISE */}
          <PlanCard
            planName="ENTERPRISE"
            priceMonthly={`NT$${enterpriseMonthly}`}
            priceYearly={`NT$${enterpriseYearly}`}
            desc={[
              '無上限影片 / 圖片',
              '可使用 DMCA 申訴'
            ]}
          />
        </div>
      </section>

      {/* 商標服務 */}
      <section style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={styles.orangeTitle}>商標服務</h2>
        <p style={styles.serviceText}>
          - 商標申請檢索：<strong>NT$ 3000 / 案</strong> (保證包辦申請) <br/>
          - 商標侵權偵測：<strong>NT$ {trademarkMonthly} / 月</strong> 
          （或 <strong>NT$ {trademarkYearly} / 年</strong>，可省 2 個月）<br/>
          - 商標訴訟：每案 <strong>NT$ 9,999</strong>，若勝訴平台抽 20%
        </p>
      </section>

      {/* 立即訂閱 / 付款 按鈕 */}
      <div style={{ textAlign:'center', marginTop:'2rem' }}>
        <button style={styles.subscribeBtn} onClick={goPayment}>
          立即訂閱 / 付款
        </button>
      </div>

      {/* 匯款資訊 */}
      <section style={{ marginTop:'3rem', textAlign:'center' }}>
        <h3 style={styles.orangeTitle}>匯款資訊 (台灣遠東國際商業銀行)</h3>
        <p>銀行代碼：<strong>805</strong></p>
        <p>帳號：<strong>00200400371797</strong></p>
        <p>戶名：<strong>YaoShengDE</strong></p>
      </section>
    </div>
  );
}

/** 
 * 單個 PlanCard 
 * @param { planName, priceMonthly, priceYearly, desc[] } 
 */
function PlanCard({ planName, priceMonthly, priceYearly, desc=[] }) {
  return (
    <div style={styles.planCard}>
      <h3 style={styles.planTitle}>{planName}</h3>
      <p style={styles.price}>
        {priceMonthly}/月 <br/>
        <span style={{ fontSize:'0.9rem', opacity:0.8 }}>
          年繳 {priceYearly}
        </span>
      </p>
      <ul style={styles.planDescUl}>
        {desc.map((d,i)=> <li key={i}>{d}</li>)}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#000',
    color: '#fff',
    minHeight: '100vh',
    padding: '2rem'
  },
  header: {
    textAlign: 'center',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '2rem'
  },
  mainTitle: {
    color: 'orange',
    fontSize: '2.2rem',
    margin: 0,
    padding: 0
  },
  subTitle: {
    color: '#ff3',
    fontSize: '1.4rem',
    margin: 0,
    padding: 0
  },
  introSection: {
    textAlign: 'center',
    margin: '0 auto',
    maxWidth: '720px',
    marginBottom: '2rem'
  },
  introText: {
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  orangeTitle: {
    color: 'orange',
    marginBottom: '1rem',
    textDecoration: 'underline'
  },
  planContainer: {
    display:'flex',
    justifyContent:'center',
    flexWrap:'wrap',
    gap:'2rem'
  },
  planCard: {
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1rem',
    width: '200px',
    backgroundColor: 'rgba(255,165,0,0.05)'
  },
  planTitle: {
    color:'orange',
    margin:'0 0 0.5rem 0',
    textDecoration:'underline',
    textAlign:'center'
  },
  price: {
    fontSize:'1.2rem',
    fontWeight:'bold',
    margin:'0.5rem 0',
    color:'#fff'
  },
  planDescUl: {
    textAlign:'left',
    margin:'1rem auto',
    maxWidth:'160px'
  },
  serviceText: {
    lineHeight:'1.6',
    margin:'0 auto',
    maxWidth:'600px'
  },
  subscribeBtn: {
    backgroundColor:'orange',
    color:'#000',
    border:'none',
    borderRadius:'6px',
    padding:'0.75rem 1.5rem',
    cursor:'pointer',
    fontSize:'1.1rem',
    fontWeight:'bold'
  }
};
