import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Home() {
  const { t } = useTranslation();
  const [caughtCount, setCaughtCount] = useState(0);
  const [protectedCount, setProtectedCount] = useState(0);

  useEffect(()=>{
    // 假設後端 /api/stats 會回傳 { caughtCount: 123, protectedCreators: 45 }
    fetch('/api/stats')
      .then(res=>res.json())
      .then(data=>{
        setCaughtCount(data.caughtCount);
        setProtectedCount(data.protectedCreators);
      })
      .catch(e=>console.log('stats err:', e));
  },[]);

  return (
    <div style={{ textAlign:'center', padding:'2rem' }}>
      <img src={shieldLogo} alt="Logo" style={{ width:'220px' }}/>
      <h1 style={{ margin:'1rem 0' }}>{t('title')}</h1>
      <h2 style={{ color:'#e74c3c' }}>{t('subtitle')}</h2>

      <div style={{ margin:'1rem 0' }}>
        <p>{t('caughtCount', { count: caughtCount })}</p>
        <p>{t('protectedCreators', { count: protectedCount })}</p>
      </div>

      <Link to="/dashboard">
        <button style={{ fontSize:'1.2rem', padding:'0.5rem 1.5rem' }}>
          {t('ctaGoHunt')}
        </button>
      </Link>
    </div>
  );
}

export default Home;
