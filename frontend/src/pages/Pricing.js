import React from 'react';

export default function PricingPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Pricing Plans</h1>

      <p style={styles.intro}>
        Whether you're an independent creator or a large enterprise, we've got a plan that fits your needs.
        Choose the one that's right for you. 
        If you have any questions, feel free to 
        <a href="/contact-us" style={styles.link}> Contact Us</a> anytime.
      </p>

      <div style={styles.planContainer}>

        {/* Free Plan */}
        <div style={styles.planCard}>
          <h2 style={styles.planTitle}>Free Plan</h2>
          <p style={styles.price}>$0 / month</p>
          <ul style={styles.featureList}>
            <li>Basic functionality</li>
            <li>Limited uploads</li>
            <li>No DMCA auto-submission</li>
          </ul>
          <button style={styles.btn}>Get Started</button>
        </div>

        {/* Pro Plan */}
        <div style={styles.planCard}>
          <h2 style={styles.planTitle}>Pro Plan</h2>
          <p style={styles.price}>$15 / month</p>
          <ul style={styles.featureList}>
            <li>Unlimited uploads</li>
            <li>AI Infringement Detection (1,000 scans/month)</li>
            <li>DMCA auto-submission</li>
            <li>Priority email support</li>
          </ul>
          <button style={styles.btn}>Upgrade Now</button>
        </div>

        {/* Enterprise Plan */}
        <div style={styles.planCard}>
          <h2 style={styles.planTitle}>Enterprise Plan</h2>
          <p style={styles.price}>$99 / month</p>
          <ul style={styles.featureList}>
            <li>Custom contract & dedicated account manager</li>
            <li>Bulk content scanning</li>
            <li>Full API access</li>
            <li>Phone & email support</li>
          </ul>
          <button style={styles.btn}>Contact Sales</button>
        </div>

      </div>

      {/* Additional Links / Info */}
      <div style={styles.extraLinks}>
        <h3>Other Services</h3>
        <ul>
          <li><a href="/enterprise" style={styles.link}>Enterprise Solutions</a></li>
          <li><a href="/api" style={styles.link}>API Access</a></li>
          <li><a href="/contact-us" style={styles.link}>Contact Us</a></li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth:'900px',
    margin:'40px auto',
    padding:'0 16px',
    color:'#fff',
  },
  heading:{
    fontSize:'2rem',
    textAlign:'center',
    marginBottom:'1.5rem'
  },
  intro:{
    fontSize:'1.1rem',
    lineHeight:'1.6',
    marginBottom:'2rem'
  },
  link:{
    color:'#ffcccc',
    marginLeft:'4px',
    textDecoration:'underline'
  },
  planContainer:{
    display:'flex',
    gap:'1rem',
    flexWrap:'wrap',
    justifyContent:'center'
  },
  planCard:{
    background:'#161b22',
    padding:'1rem',
    borderRadius:'8px',
    width:'250px',
    textAlign:'center'
  },
  planTitle:{
    fontSize:'1.3rem',
    marginBottom:'0.5rem'
  },
  price:{
    fontSize:'1.5rem',
    margin:'0.5rem 0',
    color:'#58a6ff'
  },
  featureList:{
    textAlign:'left',
    marginBottom:'1rem'
  },
  btn:{
    backgroundColor:'#238636',
    color:'#fff',
    border:'none',
    padding:'0.5rem 1.2rem',
    borderRadius:'4px',
    cursor:'pointer'
  },
  extraLinks:{
    marginTop:'2rem',
    background:'#161b22',
    padding:'1rem',
    borderRadius:'8px'
  }
};
