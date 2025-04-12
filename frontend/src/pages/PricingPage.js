// src/pages/PricingPage.js
import React from 'react';

export default function PricingPage(){
  return (
    <div style={{ textAlign:'center' }}>
      <h2>方案與價格</h2>
      <div style={{ display:'flex', justifyContent:'center', gap:'2rem', marginTop:'2rem' }}>
        
        {/* BASIC */}
        <div style={boxStyle}>
          <h3>BASIC</h3>
          <p>月費：NT$ 0 (免費)</p>
          <ul style={{ textAlign:'left' }}>
            <li>可上傳影片：3 / 月</li>
            <li>可上傳圖片：10 / 月</li>
            <li>DMCA 通知 (基礎)</li>
            <li>商標/著作權侵權爬蟲 (基礎)</li>
          </ul>
        </div>
        
        {/* PRO */}
        <div style={boxStyle}>
          <h3>PRO</h3>
          <p>月費：NT$ 999</p>
          <ul style={{ textAlign:'left' }}>
            <li>可上傳影片：15 / 月</li>
            <li>可上傳圖片：30 / 月</li>
            <li>DMCA 通知 (一般)</li>
            <li>商標/著作權侵權爬蟲 (進階)</li>
          </ul>
        </div>

        {/* ENTERPRISE */}
        <div style={boxStyle}>
          <h3>ENTERPRISE</h3>
          <p>月費：NT$ 1999</p>
          <ul style={{ textAlign:'left' }}>
            <li>可上傳影片：50 / 月</li>
            <li>可上傳圖片：90 / 月</li>
            <li>DMCA 通知 (全套)</li>
            <li>商標/著作權侵權爬蟲 (企業級)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const boxStyle = {
  border:'1px solid #888',
  borderRadius:'8px',
  padding:'1rem',
  width:'200px'
};
