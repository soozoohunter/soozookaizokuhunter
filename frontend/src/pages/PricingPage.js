// frontend/src/pages/PricingPage.js

import React from 'react';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      {/* 頂部標題、簡介 */}
      <header style={styles.header}>
        <h1 style={styles.title}>Plans & Pricing 方案與定價</h1>
        <p style={styles.subtitle}>
          Secure your copyrights and trademarks effortlessly with our "Blockchain + AI Infringement Detection" system.<br />
          透過區塊鏈與AI智慧侵權偵測，輕鬆保護您的著作權與商標權。
        </p>
      </header>

      {/* (A) 原本第一段: 著作權保護方案 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Copyright Protection 著作權保護方案</h2>
        <div style={styles.planGrid}>
          <PlanCard
            planName="BASIC"
            monthlyPrice="Free"
            annualPrice="—"
            details={[
              'Videos: 3 (Permanent)',
              'Images: 10 (Permanent)',
              '1-month infringement detection',
              'No DMCA takedown',
              'No blockchain certificate'
            ]}
            remark="(Free Trial 免費試用)"
          />

          <PlanCard
            planName="ADVANCED"
            monthlyPrice="NT$990/month"
            annualPrice="NT$9,900/year (2 months free)"
            details={[
              'Videos: Up to 5 total (Permanent)',
              'Images: Up to 20 total (Permanent)',
              'Continuous monthly infringement detection',
              'DMCA takedown enabled',
              'Blockchain certificate download'
            ]}
            remark="(Recommended for Individuals 個人推薦方案)"
          />

          <PlanCard
            planName="PRO"
            monthlyPrice="NT$2,990/month"
            annualPrice="NT$29,900/year (2 months free)"
            details={[
              'Videos: Up to 10 total (Permanent)',
              'Images: Up to 50 total (Permanent)',
              'Continuous monthly infringement detection',
              'Priority DMCA takedown',
              'Blockchain certificate download',
              'AI Content Value Prediction (coming soon)'
            ]}
            remark="(For Professional Creators 專業創作者方案)"
          />

          <PlanCard
            planName="ENTERPRISE"
            monthlyPrice="Custom Quote 客製報價"
            annualPrice="Custom Quote 客製報價"
            details={[
              'Customized uploads (Permanent)',
              'Continuous infringement detection',
              '24/7 DMCA & emergency support',
              'Full blockchain certification',
              'Advanced AI Content Value Prediction'
            ]}
            remark="(Tailored solutions 客製企業方案)"
          />
        </div>
      </section>

      {/* === 新增 1: 彈性功能付費 === */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Flexible Pay-Per-Feature 彈性功能付費</h2>
        <p style={styles.desc}>
          Not sure yet? Start with a <strong>Free Trial</strong> – 
          no account required, see how we detect potential infringements, and pay 
          only when unlocking advanced services. <br/>
          （若您還在考慮，可先用免費試用；真的需要進階服務，再做單次付費解鎖即可）
        </p>

        <div style={styles.planGrid}>
          <PlanCard
            planName="FREE TRIAL"
            monthlyPrice="NT$0"
            annualPrice="—"
            details={[
              '1 content upload',
              'Blockchain certificate preview (locked)',
              'Basic infringement scan (locked)'
            ]}
            remark="(Anonymous trial 無需帳號)"
          />
          <PlanCard
            planName="Certificate Download"
            monthlyPrice="NT$99/item"
            annualPrice="—"
            details={[
              'Full PDF certificate',
              'Blockchain timestamp proof',
              'One-time fee per content'
            ]}
            remark="(隨時付費解鎖)"
          />
          <PlanCard
            planName="Infringement Scan"
            monthlyPrice="NT$99/item"
            annualPrice="—"
            details={[
              'AI scanning result',
              'Detailed usage report',
              'One-time fee per content'
            ]}
            remark="(隨時付費啟用)"
          />
          <PlanCard
            planName="DMCA Takedown"
            monthlyPrice="NT$299/case"
            annualPrice="—"
            details={[
              'Official DMCA notice',
              'Faster takedown support',
              'One-time fee per infringement'
            ]}
            remark="(有侵權時可單次付費)"
          />
          <PlanCard
            planName="Legal Support"
            monthlyPrice="NT$9,990/case"
            annualPrice="—"
            details={[
              'IP legal consultation',
              'Full lawsuit assistance',
              '80% settlement returned'
            ]}
            remark="(大規模侵權可付費)"
          />
        </div>
      </section>

      {/* === 新增 2: 訂閱方案 (持續監控/DMCA/AI) === */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Subscription Plans 訂閱方案</h2>
        <p style={styles.desc}>
          For power users or businesses who need continuous protection, 
          consider our monthly/annual subscriptions that bundle multiple 
          certificate downloads, unlimited scans, and priority DMCA/legal coverage.
        </p>
        <div style={styles.planGrid}>
          <PlanCard
            planName="ADVANCED+"
            monthlyPrice="NT$1,490/month"
            annualPrice="NT$14,900/year (save 2 months)"
            details={[
              'Up to 8 total uploads per month',
              'Unlimited AI scans',
              'DMCA takedown included',
              'Certificate downloads included',
              'Priority email support'
            ]}
            remark="(適合經常上傳+掃描的個人創作者)"
          />
          <PlanCard
            planName="PRO+"
            monthlyPrice="NT$3,990/month"
            annualPrice="NT$39,900/year (save 2 months)"
            details={[
              'Up to 20 total uploads per month',
              'Unlimited AI scanning & alerts',
              'Priority DMCA takedown',
              'Blockchain certificates unlimited',
              '24/7 chat support'
            ]}
            remark="(專業攝影師、影音工作室)"
          />
          <PlanCard
            planName="ENTERPRISE+"
            monthlyPrice="Custom"
            annualPrice="Custom"
            details={[
              'Unlimited uploads',
              'Real-time AI detection',
              'Dedicated account manager',
              'Full legal coverage & DMCA takedown',
              'Team collaboration features'
            ]}
            remark="(大型企業客製方案)"
          />
        </div>
      </section>

      {/* (B) 原本第二段: 商標服務 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Trademark Services 商標服務</h2>
        <p style={styles.desc}>
          <strong>Single Trademark/Class</strong>: NT$999/application<br />
          (Search, filing, renewal, maintenance included; cumulative pricing per additional class)
        </p>
        <p style={styles.desc}>
          <strong>Infringement Detection (24h action)</strong>: NT$999/case
        </p>
      </section>

      {/* (C) 原本第三段: 智財訴訟 */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>IP Litigation 智慧財產訴訟</h2>
        <p style={styles.desc}>
          <strong>Copyright/Trademark Infringement</strong>: NT$9,999/case<br />
          (Upon winning, platform retains 20%, 80% returned to rights owner)
        </p>
        <p style={styles.desc}>
          Multi-national cases: Custom pricing. Contact for details.
        </p>
      </section>

      {/* 結尾 CTA */}
      <div style={styles.ctaArea}>
        <button style={styles.ctaBtn} onClick={() => window.location.href='/payment'}>
          Subscribe & Secure Your IP Now 立即訂閱並保護您的智慧財產
        </button>
      </div>
    </div>
  );
}

/* 您原本的 PlanCard 不變；只要同一支檔案裡存在即可 */
function PlanCard({ planName, monthlyPrice, annualPrice, details, remark }) {
  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>
        <span>Monthly: {monthlyPrice}</span><br />
        <span>Annual: {annualPrice}</span>
      </p>
      <ul style={cardStyles.list}>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}
    </div>
  );
}

// 保留您原先 styles，不刪任何屬性；同時確保新增段落亦能共用
const styles = {
  container: { backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', padding: '3rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '2.5rem', margin: 0, color: '#ff6f00' },
  subtitle: { fontSize: '1rem', color: '#8b949e', marginTop: '0.5rem' },
  section: { marginTop: '3rem' },
  orangeText: { color: '#ff6f00', borderBottom: '2px solid #ff6f00', display: 'inline-block' },
  desc: { marginTop: '1rem', lineHeight: '1.5' },
  planGrid: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '1.5rem', 
    flexWrap: 'wrap', 
    marginTop: '1.5rem' 
  },
  ctaArea: { textAlign: 'center', marginTop: '3rem' },
  ctaBtn: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    padding: '0.75rem 2rem',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    cursor: 'pointer'
  }
};

const cardStyles = {
  card: {
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#161b22',
    width: '240px'
  },
  planName: { color: '#ff6f00', margin: '0 0 0.5rem', fontSize: '1.5rem' },
  price: { fontWeight: 'bold', margin: '0.5rem 0' },
  list: { margin: '1rem 0', textAlign: 'left', paddingLeft: '1rem' },
  remark: { color: '#8b949e', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }
};
