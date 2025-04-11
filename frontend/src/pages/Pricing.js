import React from 'react';

export default function Pricing(){
  return (
    <div style={{ maxWidth:'700px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>Pricing 方案</h2>
      <div style={{ border:'1px solid #f00', borderRadius:'8px', padding:'1rem', marginBottom:'1rem' }}>
        <h3 style={{ color:'orange' }}>Free Plan</h3>
        <ul>
          <li>可上傳 3 件作品</li>
          <li>侵權通知 / 自動DMCA</li>
        </ul>
      </div>
      <div style={{ border:'1px solid #f00', borderRadius:'8px', padding:'1rem', marginBottom:'1rem' }}>
        <h3 style={{ color:'orange' }}>Pro Plan</h3>
        <ul>
          <li>可上傳 50 件作品</li>
          <li>企業 API 整合</li>
          <li>更多 DMCA & 訴訟服務</li>
        </ul>
      </div>
      <div style={{ border:'1px solid #f00', borderRadius:'8px', padding:'1rem' }}>
        <h3 style={{ color:'orange' }}>Enterprise Plan</h3>
        <ul>
          <li>上傳作品無上限</li>
          <li>專人客製 API</li>
          <li>深度侵權檢測 & 法務服務</li>
        </ul>
      </div>
    </div>
  );
}
