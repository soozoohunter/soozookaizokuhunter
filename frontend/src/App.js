import React from 'react';
import './App.css';

function App() {
  return (
    <div className="cyberpunk-container">
      <h1 className="glitch-text">SUZOO KAIZOKU HUNTER - V8</h1>
      <p style={{ color: '#0ff' }}>
        這裡整合了 Docker + Nginx + SSL + Express + FastAPI + Geth + IPFS + 爬蟲 + PostgreSQL
      </p>

      <div className="neon-box">
        <button className="hunt-button">🚀 啟動盜版狩獵模式</button>
        <button className="upload-button">📤 上傳作品到區塊鏈</button>
      </div>

      <div className="stats-panel">
        <h3>🛡️ 已保護作品: 1,234 件</h3>
        <h3>⚔️ 已處理侵權案件: 567 件</h3>
      </div>
    </div>
  );
}

export default App;
