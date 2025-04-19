// frontend/src/pages/PricingPage.js
import React from 'react';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plans & Pricing 方案與定價</h1>
        <p style={styles.subtitle}>
          Secure your copyrights and trademarks effortlessly with our "Blockchain + AI Infringement Detection" system.<br />
          透過區塊鏈與AI智慧侵權偵測，輕鬆保護您的著作權與商標權。
        </p>
      </header>

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

      <div style={styles.ctaArea}>
        <button style={styles.ctaBtn} onClick={() => window.location.href='/payment'}>
          Subscribe & Secure Your IP Now 立即訂閱並保護您的智慧財產
        </button>
      </div>
    </div>
  );
}

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

const styles = {
  container: { backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', padding: '3rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '2.5rem', margin: 0, color: '#ff6f00' },
  subtitle: { fontSize: '1rem', color: '#8b949e', marginTop: '0.5rem' },
  section: { marginTop: '3rem' },
  orangeText: { color: '#ff6f00', borderBottom: '2px solid #ff6f00', display: 'inline-block' },
  desc: { marginTop: '1rem', lineHeight: '1.5' },
  planGrid: { display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' },
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
