import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import './Home.css';

export default function Home() {
  useEffect(()=>{
    gsap.from(".big-title", { y:50, opacity:0, duration:1.2, ease:"power4.out" });
    gsap.from(".sub-title", { y:50, opacity:0, duration:1, delay:0.5, ease:"power2.out" });
  },[]);

  return (
    <div className="home-container">
      {/* 速誅 60px */}
      <h1 className="big-title" style={{ fontSize:'60px', fontFamily:'KaiCursive' }}>
        速誅
      </h1>
      {/* 侵權獵人系統 40px */}
      <h2 className="sub-title" style={{ fontSize:'40px', fontFamily:'KaiCursive'}}>
        侵權獵人系統
      </h2>

      <div className="intro-box">
        <p><strong>🔥 CPI（內容收益指數）</strong> - AI 精準計算短影音/圖片收益潛力...</p>
        <p><strong>🔥 CMA（著作變現建議）</strong> - 廣告收益、品牌合作、聯盟行銷...</p>
        <p><strong>🔥 DCDV（動態著作DNA）</strong> - 短影音=你的DNA，AI指紋100%比對...</p>
        <p><strong>🔥 SCDV（靜態著作DNA）</strong> - 圖片插畫攝影作品...</p>
        <p><strong>🔥 侵權通知</strong> - 一鍵DMCA，24小時下架...</p>
        <p><strong>🔥 區塊鏈存證</strong> - ETH私有鏈，不可篡改證據...</p>
        <p><strong>🔥 企業API服務</strong> - 批量監測、DMCA自動申訴...</p>
        <p><strong>🔥 ⚖️ 訴訟機制</strong> - 侵權通報後可直接發起訴訟...</p>
      </div>

      <div className="memorial">
        <p>為了紀念我最深愛的奶奶 曾李素珠小姐</p>
        <p>我們打造了「速誅侵權獵人系統」，守護每位原創者！</p>
      </div>
    </div>
  );
}
