// Home.js
import React from 'react';
// 如果 Home.css 與 Home.js 在同一個資料夾 (src/pages/)，以下寫法正確
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1 className="main-title">SuzooKaizokuHunter 速誅侵權獵人</h1>
      <p className="sub-description">
        為了紀念我最深愛的奶奶<br/>
        <span>曾李素珠女士</span>
      </p>
    </div>
  );
}

export default Home;
