import React from 'react';

function Home() {
  return (
    <div style={{ padding: '2em' }}>
      {/* 主標題：獵殺侵權者 */}
      <h1>獵殺侵權者 (Infringer Hunter)</h1>
      {/* 副標題或宣告 */}
      <h2>專業版權/商標保護與侵權追蹤系統</h2>
      {/* 介紹說明：中英文雙語 */}
      <p>
        我們的平台結合專業團隊與區塊鏈技術，提供強大的侵權監控與追蹤系統，讓侵權者無所遁形。<br/>
        <strong>Our platform leverages a professional team and blockchain technology to provide a powerful infringement monitoring and tracking system, leaving infringers with nowhere to hide.</strong>
      </p>
      <p>
        透過綁定您的社群與電商帳號並將重要資訊上鏈，我們能有效驗證原創者身份，主動出擊獵殺侵權者，全面保障您的智慧財產權。<br/>
        <strong>By binding your social and e-commerce accounts and anchoring key information on the blockchain, we effectively verify original ownership. We proactively hunt down infringers and comprehensively protect your intellectual property.</strong>
      </p>
      {/* 可選：導引按鈕讓用戶進入註冊或登入流程 */}
      <div style={{ marginTop: '2em' }}>
        <a href="/register" style={{ marginRight: '1em' }}><button>立即註冊</button></a>
        <a href="/login"><button>會員登入</button></a>
      </div>
    </div>
  );
}

export default Home;
