// src/pages/PricingPage.js
import React from 'react';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      {/* 頂部標題 */}
      <header style={styles.header}>
        <h1 style={styles.title}>方案 &amp; 定價 / Plans &amp; Pricing</h1>
        <p style={styles.subtitle}>
          本平台透過「區塊鏈 + 侵權爬蟲」，強力保護您的著作權與商標權，  
          以下為各會員方案與商標/訴訟服務費用說明。<br/>
          <em>
            Our platform uses "Blockchain + Infringement Crawler" to safeguard your copyrights and trademarks.  
            Below are membership plans and trademark/litigation pricing.
          </em>
        </p>
      </header>

      {/* 著作權保護方案 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>著作權保護方案 / Copyright Protection Plans</h2>
        <div style={styles.planGrid}>
          {/* BASIC: Free trial */}
          <PlanCard
            planName="BASIC"
            price="NT$0"
            details={[
              '短影音上限：3 部 (僅一次)',
              '圖片上限：10 張 (僅一次)',
              '無 DMCA 下架申訴權限',
              '無法下載上鏈紀錄',
              'No DMCA Takedown, No chain record download'
            ]}
            remark="(免費註冊方案)"
          />

          {/* ADVANCED */}
          <PlanCard
            planName="ADVANCED"
            price="NT$999 / 月"
            details={[
              '短影音上限：10 部',
              '圖片上限：30 張',
              '可使用 DMCA 下架申訴',
              '可下載區塊鏈原創證明'
            ]}
            remark="(每月自動續訂 / Monthly)"
          />

          {/* PRO */}
          <PlanCard
            planName="PRO"
            price="NT$1,999 / 月"
            details={[
              '短影音上限：50 部',
              '圖片上限：100 張',
              'DMCA 下架申訴 + 限時技術支援',
              '可下載區塊鏈原創證明'
            ]}
            remark="(每月自動續訂 / Monthly)"
          />

          {/* ENTERPRISE - Small */}
          <PlanCard
            planName="ENTERPRISE (Small)"
            price="NT$2,999 / 月"
            details={[
              '短影音上限：300 部',
              '圖片上限：600 張',
              'DMCA 下架申訴 + 優先技術支援',
              '可下載區塊鏈原創證明'
            ]}
            remark="(每月自動續訂 / Monthly)"
          />

          {/* ENTERPRISE - Large */}
          <PlanCard
            planName="ENTERPRISE (Large)"
            price="NT$4,999 / 月"
            details={[
              '短影音無上限',
              '圖片無上限',
              'DMCA 下架申訴 + 24/7 緊急服務',
              '可下載區塊鏈原創證明'
            ]}
            remark="(每月自動續訂 / Monthly)"
          />
        </div>
      </section>

      {/* 商標服務 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>商標服務 / Trademark Services</h2>
        <p style={styles.desc}>
          <strong>單一商標、單一類別</strong>：每次收費 NT$999  
          (包含申請、檢索、延展、維護等。如同時申請多類別，則按類別數量累計)  
          <br/><em>
            Each brand or mark + single class: NT$999 per application.  
            (Includes search, filing, renewal, and basic maintenance. Multiple classes add up cumulatively.)
          </em>
        </p>
        <p style={styles.desc}>
          商標侵權偵測，若需 24 小時內發函或提出異議，每案再收 NT$999  
          <br/><em>
            Trademark infringement detection & swift notice within 24 hours: an additional NT$999 per case
          </em>
        </p>
      </section>

      {/* 訴訟服務 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>智慧財產訴訟 / IP Litigation</h2>
        <p style={styles.desc}>
          <strong>著作權侵權訴訟 / 商標權侵權訴訟</strong>：單次 NT$999  
          (若勝訴，平台抽 20% 分潤，餘 80% 歸原著作權人或商標權人)  
          <br/><em>
            Copyright or Trademark Infringement Lawsuits: NT$999 per case,  
            platform takes 20% upon successful litigation, 80% returns to the rights owner.
          </em>
        </p>
        <p style={styles.desc}>
          若需跨國及多國訴訟，費用另計；可另洽詢客製方案。  
          <br/><em>
            For multi-national lawsuits, custom fees apply; contact us for tailored solutions.
          </em>
        </p>
      </section>

      {/* CTA：連到 Payment 或其他頁面 */}
      <div style={styles.ctaArea}>
        <button style={styles.ctaBtn} onClick={()=>window.location.href='/payment'}>
          立即訂閱或提交付款 / Subscribe &amp; Pay
        </button>
      </div>
    </div>
  );
}

/** 
 * PlanCard: 顯示方案資訊的元件
 * @param {object} props 
 *   - planName: 方案名稱
 *   - price: 顯示的價格字串
 *   - details: 字串陣列，列出功能或限制
 *   - remark: (可選) 顯示在卡片底部的備註 
 */
function PlanCard({ planName, price, details, remark }) {
  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}</p>
      <ul style={cardStyles.list}>
        {details.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}
    </div>
  );
}

/* 主要頁面樣式 */
const styles = {
  container: {
    backgroundColor: '#000',
    color: '#fff',
    minHeight: '100vh',
    padding: '2rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.2rem',
    margin: 0,
    color: 'orange'
  },
  subtitle: {
    marginTop: '0.5rem',
    fontSize: '1rem',
    lineHeight: '1.4',
    color: '#ccc'
  },
  section: {
    marginTop: '2rem'
  },
  orangeText: {
    color: 'orange',
    marginBottom: '1rem',
    borderBottom: '2px solid orange',
    display:'inline-block'
  },
  desc: {
    marginBottom: '1rem',
    lineHeight: '1.6'
  },
  planGrid: {
    display:'flex',
    flexWrap:'wrap',
    gap:'1.5rem',
    justifyContent:'center'
  },
  ctaArea: {
    textAlign:'center',
    marginTop:'2rem'
  },
  ctaBtn: {
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

/* 方案卡片樣式 */
const cardStyles = {
  card: {
    border:'2px solid orange',
    borderRadius:'8px',
    padding:'1rem',
    width:'220px',
    backgroundColor:'rgba(255,165,0,0.1)'
  },
  planName: {
    color:'orange',
    margin:'0 0 0.5rem 0',
    fontSize:'1.4rem',
    textDecoration:'underline'
  },
  price: {
    fontSize:'1.2rem',
    fontWeight:'bold',
    margin:'0.5rem 0',
    color:'#fff'
  },
  list: {
    textAlign:'left',
    margin:'1rem auto',
    maxWidth:'200px'
  },
  remark: {
    marginTop:'1rem',
    fontSize:'0.9rem',
    color:'#bbb',
    fontStyle:'italic',
    textAlign:'center'
  }
};
