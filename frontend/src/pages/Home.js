import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import { io } from 'socket.io-client';

function Home() {
  const { t } = useTranslation();
  const [caughtCount, setCaughtCount] = useState(0);
  const [protectedCount, setProtectedCount] = useState(0);

  useEffect(() => {
    setCaughtCount(1000);
    setProtectedCount(200);

    const socket = io('/', { 
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });
    socket.on('infrCountUpdate', (data) => {
      if (data?.total !== undefined) {
        setCaughtCount(data.total);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [t]);

  return (
    <div className="home-container">
      <div className="banner">
        <img src={logo} alt="HunterX Logo" style={{ width: '200px' }} />
        <h1 style={{ color: '#f8c12f', fontSize: '3rem', margin: '1rem 0' }}>
          {t('siteTitle')}
        </h1>
        <div className="game-stats">
          <p>{t('caughtCount', { count: caughtCount })}</p>
          <p>{t('protectedCreators', { count: protectedCount })}</p>
        </div>
        <button
          className="game-button"
          onClick={() => {
            window.location.href = '/dashboard';
          }}
        >
          {t('startHunt')}
        </button>
      </div>
    </div>
  );
}

export default Home;
