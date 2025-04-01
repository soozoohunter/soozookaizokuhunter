import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import './Home.css';

export default function Home() {
  useEffect(()=>{
    gsap.from('.big-title',{ y:50, opacity:0, duration:1.2 });
    gsap.from('.sub-title',{ y:50, opacity:0, duration:1, delay:0.5 });
  },[]);

  return (
    <div className="home-container">
      {/* 速誅 => 60px */}
      <h1 className="big-title" style={{ fontSize:'60px', fontFamily:'KaiCursive'}}>
        速誅
      </h1>
      {/* 侵權獵人系統 => 40px */}
      <h2 className="sub-title" style={{ fontSize:'40px', fontFamily:'KaiCursive'}}>
        侵權獵人系統
      </h2>

      <div className="intro-box">
        <p><strong>🔥 CPI</strong>：AI 精準計算 影片/圖片 在多平台收益潛力</p>
        <p><strong>🔥 CMA</strong>：一鍵找出最優變現機制 (廣告收益/品牌合作…)</p>
        <p><strong>🔥 DCDV</strong>：短影音=動態DNA，AI指紋比對防裁切、變速</p>
        <p><strong>🔥 SCDV</strong>：靜態DNA (圖片插畫攝影)，企業API批量偵測</p>
        <p><strong>🔥 侵權通知</strong>：自動DMCA，24小時內下架</p>
        <p><strong>🔥 區塊鏈存證</strong>：ETH私有鏈，不可篡改證據</p>
        <p><strong>🔥 企業API</strong>：批量監測、DMCA自動申訴</p>
        <p><strong>🔥 ⚖️ 訴訟機制</strong>：可快速提告、讓侵權者付出代價</p>
      </div>

      <div className="memorial">
        <p>為了紀念 我最深愛的奶奶 曾李素珠小仙女</p>
        <p>特打造「速誅侵權獵人系統」，守護每位原創者！</p>
      </div>
    </div>
  );
}
