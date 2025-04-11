// frontend/src/pages/Pricing.js
import React from 'react';

export default function Pricing(){
  return (
    <div style={{ maxWidth:'800px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>Pricing</h2>

      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'#333' }}>
            <th style={thTdStyle}>方案</th>
            <th style={thTdStyle}>價格</th>
            <th style={thTdStyle}>功能</th>
            <th style={thTdStyle}></th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background:'#222' }}>
            <td style={thTdStyle}>BASIC</td>
            <td style={thTdStyle}>NT$ 0 / 月</td>
            <td style={thTdStyle}>
              3 次影片 + 10 張圖片上傳<br/>
              DMCA 自動申訴
            </td>
            <td style={thTdStyle}>
              <button style={btnStyle} disabled>預設方案</button>
            </td>
          </tr>
          <tr style={{ background:'#222' }}>
            <td style={thTdStyle}>PRO</td>
            <td style={thTdStyle}>NT$ 499 / 月</td>
            <td style={thTdStyle}>
              不限圖片 / 影片上傳<br/>
              DMCA + 簡易訴訟協助
            </td>
            <td style={thTdStyle}>
              <button style={btnStyle}>
                (登入會員中心升級)
              </button>
            </td>
          </tr>
          <tr style={{ background:'#222' }}>
            <td style={thTdStyle}>ENTERPRISE</td>
            <td style={thTdStyle}>洽談</td>
            <td style={thTdStyle}>
              企業API整合, 批量監測<br/>
              專人訴訟協助
            </td>
            <td style={thTdStyle}>
              <button style={btnStyle}>
                聯絡我們
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const thTdStyle = {
  border:'1px solid #666',
  padding:'8px',
  textAlign:'center'
};
const btnStyle = {
  padding:'6px 12px',
  backgroundColor:'orange',
  border:'none',
  borderRadius:'4px',
  color:'#fff',
  cursor:'pointer'
};
