import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [role, setRole] = useState(localStorage.getItem('role')||'shortVideo');

  useEffect(()=>{
    setRole(localStorage.getItem('role')||'shortVideo');
  },[]);

  return (
    <div style={{ margin:'2rem'}}>
      <h2 style={{fontSize:'1.8rem'}}>個人主頁 (Dashboard)</h2>
      <p>您目前的角色： <strong>{ role==='shortVideo'?'短影音網紅':'個人電商賣家' }</strong></p>

      {role==='shortVideo'
        ? <p>可上傳最多15部短影音 (30秒內)。系統會為您生成「動態指紋DNA」並上鏈存證。</p>
        : <p>可上傳最多30張商品圖片，生成「靜態指紋DNA」並上鏈。</p>
      }

      <div style={{marginTop:'1rem'}}>
        <Link to="/upload">[開始上傳作品]</Link>
      </div>
      
      <div style={{marginTop:'1rem'}}>
        <Link to="/infringements">[查看侵權紀錄與DMCA/提告]</Link>
      </div>
    </div>
  );
}
