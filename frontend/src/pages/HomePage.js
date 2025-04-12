// frontend/src/pages/HomePage.js
import React from 'react';

export default function HomePage() {
  // 計算年繳折扣：假設月費 * 12 - (2個月優惠) 的概念
  // 例如 BASIC 月299 => 年繳2990 (少繳 598)
  const basicMonthly = 299;
  const basicYearly = 2990; // 假設等於 299*10
  const proMonthly = 999;
  const proYearly = 9990;   // 等於 999*10
  const enterpriseMonthly = 1999;
  const enterpriseYearly = 19990; // 等於 1999*10

  // 商標部分：月99 => 年990 (同理)
  const trademarkMonthly = 99;
  const trademarkYearly = 990;

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '1rem' }}>
      {/* 頂部橫幅 */}
      <header style={{ textAlign: 'center', borderBottom: '1px solid #444', marginBottom: '1rem' }}>
        <h1 style={{ color: 'orange', fontSize: '2rem', margin: '0.5rem 0' }}>
          Welcome to Our IP Hunter System
        </h1>
        <p style={{ color: 'red', margin: '0.5rem 0' }}>
          Contact: Mr. Yao | +886900296168 |{' '}
          <a href="mailto:jeffqqm@gmail.com" style={{ color: '#ff6600' }}>
            jeffqqm@gmail.com
          </a>
        </p>
      </header>

      {/* 核心介紹 */}
      <section style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'orange', marginBottom: '1rem' }}>
          世界首創一站式著作權上鏈 & 侵權偵測 & DMCA 申訴 & 商標申請/檢索/維權
        </h2>
        <p style={{ maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          本平台提供<strong>動態 Fingerprint</strong>（短影音）與<strong>靜態 Fingerprint</strong>
          （商品圖片），全程上鏈保留智慧財產證據。若發生侵權，我們可於 24 小時內執行 DMCA
          下架。另提供「商標一站式申請與監控」，讓您輕鬆維護延展，免除繁雜紀錄。
        </p>
      </section>

      {/* Pricing 區塊 */}
      <section style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'orange', marginBottom: '1rem' }}>Pricing Plans</h2>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          {/* 版權 BASIC */}
          <div style={planBoxStyle}>
            <h3 style={planTitleStyle}>Copyright BASIC</h3>
            <p>Free for 1st month (3 videos, 10 images)</p>
            <p>Next month: <strong>NT$ {basicMonthly}/month</strong></p>
            <p>Yearly: <strong>NT$ {basicYearly}/year</strong> (約省 2 個月)</p>
          </div>
          {/* 版權 PRO */}
          <div style={planBoxStyle}>
            <h3 style={planTitleStyle}>Copyright PRO</h3>
            <p>NT$ {proMonthly}/month</p>
            <p>Yearly: NT$ {proYearly}/year</p>
            <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: '200px' }}>
              <li>15 Videos / mo</li>
              <li>30 Images / mo</li>
              <li>DMCA Full Support</li>
            </ul>
          </div>
          {/* 版權 ENTERPRISE */}
          <div style={planBoxStyle}>
            <h3 style={planTitleStyle}>Copyright ENTERPRISE</h3>
            <p>NT$ {enterpriseMonthly}/month</p>
            <p>Yearly: NT$ {enterpriseYearly}/year</p>
            <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: '200px' }}>
              <li>30 Videos / mo</li>
              <li>60 Images / mo</li>
              <li>DMCA Ultra Support</li>
            </ul>
          </div>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: '#888' }} />

        <h2 style={{ color: 'orange', marginBottom: '1rem' }}>Trademark Plans</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* 商標 Basic (第一個月免費) */}
          <div style={planBoxStyle}>
            <h3 style={planTitleStyle}>Trademark Basic</h3>
            <p>First Month FREE (申請 1 件 + 1 次檢索 + 1 次維權)</p>
            <p>Next: NT$ {trademarkMonthly}/month</p>
            <p>Yearly: NT$ {trademarkYearly}/year</p>
          </div>
          {/* 可再細分其他商標方案 */}
        </div>
      </section>

      {/* 匯款資訊 */}
      <section style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h3 style={{ color: 'orange' }}>匯款資訊 (台灣遠東國際商業銀行)</h3>
        <p>銀行代碼：<strong>805</strong> (Far Eastern International Bank)</p>
        <p>帳號：<strong>00200400371797</strong></p>
        <p>戶名：<strong>YaoShengDE</strong></p>
      </section>
    </div>
  );
}

const planBoxStyle = {
  border: '2px solid orange',
  borderRadius: '8px',
  padding: '1rem',
  width: '240px',
};

const planTitleStyle = {
  marginBottom: '0.5rem',
  color: 'orange',
  textDecoration: 'underline',
};
