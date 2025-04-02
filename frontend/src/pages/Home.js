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

    const socket = io('/', { path: '/socket.io' });
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

        <h1 className="game-title-big">速誅</h1>
        <h2 className="game-title-small">侵權獵人 HunterX 系統</h2>

        <div className="game-stats">
          <p>{t('caughtCount', { count: caughtCount })}</p>
          <p>{t('protectedCreators', { count: protectedCount })}</p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button
            className="game-button"
            onClick={() => { window.location.href = '/register?type=short-video'; }}
          >
            我是短影音著作權人
          </button>
          &nbsp;&nbsp;&nbsp;
          <button
            className="game-button"
            onClick={() => { window.location.href = '/register?type=seller'; }}
          >
            我是個人商店賣家
          </button>
        </div>
      </div>

      <div className="footer-tribute">
        為了紀念我最深愛的奶奶曾李素珠 小仙女 所開發的侵權偵測系統
      </div>
    </div>
  );
}

export default Home;
