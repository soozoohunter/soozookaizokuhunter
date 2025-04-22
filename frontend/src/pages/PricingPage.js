// frontend/src/pages/PricingPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Plans & Pricing 方案與定價</h1>
        <p style={styles.subtitle}>
          Secure your copyrights and trademarks effortlessly with our "Blockchain + AI Infringement Detection" system.
        </p>
      </header>

      <section style={styles.section}>
        <h2 style={styles.orangeText}>Subscription Plans 訂閱方案</h2>
        <div style={styles.planGrid}>
          <PlanCard
            planName="BASIC"
            price="NT$299"
            itemParam="basic_plan"
            details={[
              'Up to 3 videos, 5 images',
              '24h infringement detection',
              'Blockchain certificate included'
            ]}
          />
          <PlanCard
            planName="PRO"
            price="NT$799"
            itemParam="pro_plan"
            details={[
              'Up to 10 videos, 20 images',
              'Priority infringement detection',
              'Free DMCA takedown',
              'Blockchain certificate included'
            ]}
          />
          <PlanCard
            planName="ENTERPRISE"
            price="NT$1999"
            itemParam="enterprise_plan"
            details={[
              'Unlimited uploads',
              'Real-time AI scanning',
              'Full DMCA + Legal coverage'
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function PlanCard({ planName, price, itemParam, details }) {
  const numericPrice = price.replace(/[^0-9]/g, '') || '299'; 
  // 假設提取金額(299,799,1999...) 用於URL param

  return (
    <div style={cardStyles.card}>
      <h3 style={cardStyles.planName}>{planName}</h3>
      <p style={cardStyles.price}>{price}/month</p>
      <ul style={cardStyles.list}>
        {details.map((txt, i) => <li key={i}>{txt}</li>)}
      </ul>
      <Link 
        to={`/payment?item=${itemParam}&price=${numericPrice}`}
        style={cardStyles.buyBtn}
      >
        Buy Now
      </Link>
    </div>
  );
}

// Style
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
  orangeText: { color: '#ff6f00', borderBottom: '2px solid #ff6f00', display: 'inline-block' },
  planGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    marginTop: '1.5rem'
  }
};

const cardStyles = {
  card: {
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#161b22',
    width: '240px',
    textAlign: 'center'
  },
  planName: { color: '#ff6f00', margin: '0 0 0.5rem', fontSize: '1.5rem' },
  price: { fontWeight: 'bold', margin: '0.5rem 0', fontSize: '1.2rem' },
  list: { margin: '1rem 0', textAlign: 'left', paddingLeft: '1rem' },
  buyBtn: {
    display:'inline-block',
    marginTop:'1rem',
    padding: '0.6rem 1.2rem',
    backgroundColor:'#ff6f00',
    color:'#fff',
    textDecoration:'none',
    borderRadius:'4px'
  }
};
