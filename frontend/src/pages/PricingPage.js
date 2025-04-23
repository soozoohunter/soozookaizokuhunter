// frontend/src/pages/PricingPage.js

import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plans & Pricing 方案與定價</h1>
        <p style={styles.subtitle}>
          Secure your copyrights and trademarks effortlessly with our
          <br/>
          <strong>Blockchain + AI Infringement Detection</strong> system, plus legal support when you need it most.
        </p>
      </header>

      {/* A) Subscription Plans */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Subscription Plans 訂閱方案</h2>
        <p style={styles.sectionDesc}>
          Choose a monthly or annual subscription for continuous blockchain certification and AI-powered infringement detection.
          <br/>
          選擇月付或年付訂閱，持續享有區塊鏈認證與 AI 侵權偵測服務。
        </p>
        <div style={styles.planGrid}>
          <PlanCard
            planName="BASIC"
            price="NT$490"
            itemParam="basic_plan"
            details={[
              '3 videos, 5 images total',
              '24h infringement detection',
              'Blockchain certificate (unlimited downloads)',
              '1 free DMCA takedown / month'
            ]}
            remark="適合初階創作者 / 部落客"
          />

          <PlanCard
            planName="PRO"
            price="NT$1,290"
            itemParam="pro_plan"
            details={[
              '10 videos, 30 images total',
              'Priority AI scanning (daily)',
              'Unlimited blockchain certificates',
              '3 free DMCA takedowns / month',
              'Basic legal consultation (email)'
            ]}
            remark="適合專業影音工作室 / 插畫師"
          />

          <PlanCard
            planName="ENTERPRISE"
            price="NT$3,990"
            itemParam="enterprise_plan"
            details={[
              'Unlimited videos & images',
              'Real-time AI scanning',
              'Unlimited DMCA takedowns',
              'Advanced legal coverage (in-house counsel)',
              'Team collaboration (5 seats included)'
            ]}
            remark="適合企業、大型媒體集團"
          />
        </div>
      </section>

      {/* B) Flexible Pay-Per-Feature */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>Flexible Pay-Per-Feature 彈性功能付費</h2>
        <p style={styles.sectionDesc}>
          Not ready to subscribe? Purchase individual features as needed, after a free upload and scan.
          <br/>
          不想訂閱？先免費上傳與掃描，再依需求單次購買功能即可。
        </p>
        <div style={styles.planGrid}>
          <FeatureCard
            planName="Certificate Download"
            price="NT$99 / item"
            itemParam="certificate"
            details={[
              'Generate PDF originality certificate',
              'Includes blockchain timestamp & hash',
              'Instant download for safekeeping'
            ]}
          />
          <FeatureCard
            planName="Infringement Scan"
            price="NT$99 / item"
            itemParam="scan"
            details={[
              'AI-powered search simulation',
              'Identify infringement sources',
              'One-time fee per scan'
            ]}
          />
          <FeatureCard
            planName="DMCA Takedown"
            price="NT$299 / case"
            itemParam="dmca"
            details={[
              'Official DMCA takedown process',
              'Faster content removal',
              'One fee per case'
            ]}
          />
          <FeatureCard
            planName="Legal Support"
            price="NT$9,990 / case"
            itemParam="legal"
            details={[
              'IP law consultation',
              'Full litigation assistance',
              '80% of awards returned to you'
            ]}
          />
        </div>
      </section>

      {/* C) IP Litigation & Trademark Services */}
      <section style={styles.section}>
        <h2 style={styles.orangeText}>IP Litigation & Trademark Services 訴訟與商標服務</h2>
        <p style={styles.sectionDesc}>
          For deeper legal actions or global trademark filings, choose from our specialized services below.
          <br/>
          若需更深入的法律行動或全球商標註冊，請參考以下專業方案。
        </p>
        <div style={styles.planGrid}>
          <LitigationCard
            planName="Copyright Litigation"
            price="NT$12,000 ~"
            itemParam="copyright_sue"
            details={[
              'Full infringement lawsuit support',
              'Evidence gathering, notices, court appearance',
              'Platform takes 20% of final award'
            ]}
          />
          <LitigationCard
            planName="Trademark Global Filing"
            price="NT$4,999+"
            itemParam="tm_global"
            details={[
              'Multi-country trademark applications',
              'Search, filing, renewals',
              'End-to-end service'
            ]}
          />
          <LitigationCard
            planName="Anti-Counterfeit Action"
            price="Custom"
            itemParam="anti_counterfeit"
            details={[
              'Cross-border e-commerce scans & customs holds',
              'Comprehensive legal enforcement',
              'Case-by-case quotes'
            ]}
            remark="適合國際品牌 / 大規模打擊"
          />
        </div>
      </section>
    </div>
  );
}

/* ---- PlanCard ---- */
function PlanCard({ planName, price, itemParam, details, remark }) {
  const numericPrice = price.replace(/[^0-9]/g, '') || '490';
  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}/month</p>
      <ul style={cardStyles.list}>
        {details.map((txt,i)=><li key={i}>{txt}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}
      <Link to={`/payment?item=${itemParam}&price=${numericPrice}`} style={cardStyles.buyBtn}>
        Buy Now
      </Link>
    </div>
  );
}

/* ---- FeatureCard ---- */
function FeatureCard({ planName, price, itemParam, details }) {
  const numericPrice = price.replace(/[^0-9]/g, '') || '99';
  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}</p>
      <ul style={cardStyles.list}>
        {details.map((txt,i)=><li key={i}>{txt}</li>)}
      </ul>
      <Link to={`/payment?item=${itemParam}&price=${numericPrice}`} style={cardStyles.buyBtn}>
        Pay
      </Link>
    </div>
  );
}

/* ---- LitigationCard ---- */
function LitigationCard({ planName, price, itemParam, details, remark }) {
  const numericPrice = price.replace(/[^0-9]/g, '') || '10000';
  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}</p>
      <ul style={cardStyles.list}>
        {details.map((txt,i)=><li key={i}>{txt}</li>)}
      </ul>
      {remark && <p style={cardStyles.remark}>{remark}</p>}
      <Link to={`/payment?item=${itemParam}&price=${numericPrice}`} style={cardStyles.buyBtn}>
        Contact / Pay
      </Link>
    </div>
  );
}

/* ----- Styles ----- */
const styles = {
  container: {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    padding: '3rem'
  },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '2.5rem', margin: 0, color: '#ff6f00' },
  subtitle: { fontSize: '1rem', color: '#8b949e', marginTop: '0.5rem' },
  section: { marginTop: '3rem' },
  sectionDesc: { marginTop: '0.5rem', lineHeight: 1.5, color: '#ccc', fontSize: '0.95rem' },
  orangeText: { color: '#ff6f00', borderBottom: '2px solid #ff6f00', display: 'inline-block' },
  planGrid: { display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem' }
};

const cardStyles = {
  card: {
    backgroundColor: '#161b22',
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '1rem',
    width: '250px',
    textAlign: 'center'
  },
  planName: { color: '#ff6f00', margin: '0 0 .5rem', fontSize: '1.4rem' },
  price: { fontWeight: 'bold', margin: '0.5rem 0', fontSize: '1.2rem' },
  list: { textAlign: 'left', paddingLeft: '1.2rem', margin: '1rem 0' },
  remark: { color: '#8b949e', fontSize: '0.85rem', marginTop: '.5rem' },
  buyBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#ff6f00',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px'
  }
};
