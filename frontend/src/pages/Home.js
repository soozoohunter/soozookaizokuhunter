// frontend/src/pages/Home.js
import React, { useEffect, useState } from 'react';
import './styles.css'; // or './Home.css'

export default function Home() {
  const [caughtCount, setCaughtCount] = useState(0);
  const [protectedCount, setProtectedCount] = useState(0);

  useEffect(() => {
    // 這裡可向後端 /api/stats 拉取實際資料
    setCaughtCount(1357);
    setProtectedCount(224);
  }, []);

  return (
    <div className="home-container">
      <div className="banner-hunter">
        {/* 如果logo、hunter-logo沒定義, 可以先註解或刪除 */}
        {/* <img src={logo} alt="HunterX Logo" className="hunter-logo" /> */}
        <h1 className="hunter-title">速誅侵權獵人 系統</h1>
        <p className="hunter-slogan">守護原創·快速擊殺侵權</p>
        <div className="hunter-stats">
          <p>已誅殺侵權：{caughtCount} 件！</p>
          <p>已保護創作者：{protectedCount} 位</p>
        </div>
        <button
          className="hunter-button"
          onClick={() => {
            window.location.href = '/dashboard';
          }}
        >
          進入我的獵場
        </button>
      </div>
    </div>
  );
}
