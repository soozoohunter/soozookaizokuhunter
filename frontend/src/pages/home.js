import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h1>速誅侵權獵人</h1>
      <h2>曾李素珠 女士 侵權偵測系統</h2>
      <p>
        這個系統是為了紀念我最愛的奶奶 <strong>曾李素珠 女士</strong> 所打造。<br/>
        現在就加入我們，一同守護您的創作權益！<br/>
        <small>(支援短影音 / 商品照片上傳，私有鏈指紋存證，自動偵測侵權與快速 DMCA / 法律訴訟)</small>
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/signup" className="btn-home">註冊</Link>
        <Link to="/login" className="btn-home">登入</Link>
      </div>
    </div>
  );
}

export default Home;
