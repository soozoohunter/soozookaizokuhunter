// src/pages/Home.js
import React from 'react';

// 如果有單獨的 Home.css 放在 pages/ 同層，可用 import './Home.css';
// 若無就不需要
// import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1 className="main-title">SuzooKaizokuHunter 速誅侵權獵人</h1>
      <p className="sub-description">
        為了紀念我最深愛的奶奶<br />
        <span>曾李素珠女士</span>
      </p>
    </div>
  );
}

export default Home;
