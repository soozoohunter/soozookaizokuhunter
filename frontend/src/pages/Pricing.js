// frontend/src/pages/Pricing.js
import React from 'react';

export default function Pricing() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Our Plans &amp; Pricing</h2>
      <p style={styles.desc}>
        Choose the best plan that suits your needs. All plans include basic 
        infringement monitoring and DMCA takedown support.
      </p>

      <div style={styles.grid}>
        {/* ========== FREE PLAN ========== */}
        <div style={styles.card}>
          <h3 style={styles.planName}>Free Plan</h3>
          <p style={styles.price}>$0 / month</p>
          <ul style={styles.featureList}>
            <li>- Up to 3 short videos per month</li>
            <li>- Up to 10 images per month</li>
            <li>- Basic infringement alerts</li>
            <li>- DMCA takedown (manual request)</li>
          </ul>
          <button style={styles.button} disabled>Current Plan</button>
        </div>

        {/* ========== ADVANCED PLAN ========== */}
        <div style={styles.card}>
          <h3 style={styles.planName}>Advanced Plan</h3>
          <p style={styles.price}>$15.99 / month</p>
          <ul style={styles.featureList}>
            <li>- Up to 15 short videos per month</li>
            <li>- Up to 30 images per month</li>
            <li>- Priority infringement alerts</li>
            <li>- Auto DMCA takedown within 24h</li>
          </ul>
          <button style={styles.button}>Upgrade</button>
        </div>

        {/* ========== PRO PLAN ========== */}
        <div style={styles.card}>
          <h3 style={styles.planName}>Pro Plan</h3>
          <p style={styles.price}>$29.99 / month</p>
          <ul style={styles.featureList}>
            <li>- Up to 30 short videos per month</li>
            <li>- Up to 60 images per month</li>
            <li>- Auto DMCA takedown within 12h</li>
            <li>- Priority lawsuit assistance</li>
          </ul>
          <button style={styles.button}>Upgrade</button>
        </div>

        {/* ========== ENTERPRISE PLAN ========== */}
        <div style={styles.card}>
          <h3 style={styles.planName}>Enterprise Plan</h3>
          <p style={styles.price}>$99.99 / month</p>
          <ul style={styles.featureList}>
            <li>- Higher or no monthly limit (Negotiable)</li>
            <li>- Full enterprise API integration</li>
            <li>- 24/7 DMCA &amp; legal support</li>
            <li>- Lawsuit coverage &amp; advanced detection</li>
          </ul>
          <button style={styles.button}>Contact Us</button>
        </div>
      </div>

      <div style={styles.note}>
        <p>
          <strong>Note:</strong> 
          &nbsp;Lawsuit service fee is 9000 TWD (about $300) per case, 
          and if you win, we charge 20% from the compensation. 
        </p>
      </div>
    </div>
  );
}

// ============= CSS in JS =============
const styles = {
  container: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '1rem',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    color: '#fff'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    textAlign: 'center',
    color: '#ff1c1c'
  },
  desc: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center'
  },
  card: {
    flex: '1 1 220px',
    minWidth: '220px',
    maxWidth: '280px',
    background: '#222',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center',
    border: '1px solid #444'
  },
  planName: {
    fontSize: '1.3rem',
    marginBottom: '0.5rem',
    color: '#fff'
  },
  price: {
    fontSize: '1.5rem',
    margin: '0.5rem 0 1rem',
    color: '#ff1c1c'
  },
  featureList: {
    listStyle: 'none',
    padding: '0',
    textAlign: 'left',
    marginBottom: '1rem'
  },
  button: {
    background: '#ff1c1c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer'
  },
  note: {
    marginTop: '2rem',
    fontSize: '0.9rem',
    textAlign: 'center'
  }
};
