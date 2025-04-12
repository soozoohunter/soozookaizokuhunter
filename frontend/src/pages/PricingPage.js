// src/pages/PricingPage.js
import React from 'react';

export default function PricingPage(){
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Pricing</h2>
      <p style={styles.subtitle}>
        Choose a plan that fits your needs. Our system offers three main tiers:
      </p>

      <div style={styles.plansWrapper}>

        {/* BASIC PLAN */}
        <div style={styles.planBox}>
          <h3 style={styles.planTitle}>BASIC</h3>
          <p style={styles.planPrice}>Free</p>
          <ul style={styles.ul}>
            <li>Up to 3 video uploads/month</li>
            <li>Up to 10 images/month</li>
            <li>Basic DMCA takedown support</li>
            <li>Basic trademark monitoring</li>
          </ul>
        </div>

        {/* PRO PLAN */}
        <div style={styles.planBox}>
          <h3 style={styles.planTitle}>PRO</h3>
          <p style={styles.planPrice}>$29.99 / month</p>
          <ul style={styles.ul}>
            <li>Up to 15 video uploads/month</li>
            <li>Up to 30 images/month</li>
            <li>Priority DMCA takedown service (24 hrs)</li>
            <li>Advanced trademark monitoring</li>
          </ul>
        </div>

        {/* ENTERPRISE PLAN */}
        <div style={styles.planBox}>
          <h3 style={styles.planTitle}>ENTERPRISE</h3>
          <p style={styles.planPrice}>$99.99 / month</p>
          <ul style={styles.ul}>
            <li>Up to 30 video uploads/month</li>
            <li>Up to 60 images/month</li>
            <li>Full DMCA takedown service (24 hrs guaranteed)</li>
            <li>Enterprise-level trademark monitoring & management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#000',
    minHeight: '100vh',
    color:'#fff',
    padding:'2rem',
    textAlign:'center'
  },
  title: {
    color:'orange',
    marginBottom:'1rem'
  },
  subtitle: {
    color:'#ff5555',
    marginBottom:'2rem'
  },
  plansWrapper: {
    display:'flex',
    justifyContent:'center',
    gap:'2rem',
    flexWrap:'wrap'
  },
  planBox: {
    border:'2px solid orange',
    borderRadius:'8px',
    padding:'1rem',
    width:'240px',
    marginBottom:'1rem'
  },
  planTitle: {
    color:'orange',
    marginTop:0
  },
  planPrice: {
    color:'#fff',
    fontWeight:'bold'
  },
  ul: {
    textAlign:'left',
    margin:'1rem 0',
    lineHeight:'1.5'
  }
};
