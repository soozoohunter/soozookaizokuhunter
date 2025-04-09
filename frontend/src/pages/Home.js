// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={styles.outer}>

      {/* 大標題：DCDV / SCDV / ... 可以放最頂 */}
      <div style={styles.heroSection}>
        <h1 style={styles.title}>速誅SUZOO! Copyright Hunter System</h1>
        <p style={styles.subtitle}>
          以 <span style={styles.highlightOrange}>DC-DV</span>（動態著作DNA辨識）與{' '}
          <span style={styles.highlightOrange}>SC-DV</span>（靜態著作DNA辨識） 為核心，結合區塊鏈 + AI，
          為您的創作提供全自動維權！
        </p>
        {/* 例如您想擺兩個火焰圖示對稱 (範例用Emoji 🔥) */}
        <div style={styles.flameRow}>
          <span style={styles.flame}>🔥</span>
          <span style={styles.flame}>🔥</span>
        </div>
      </div>

      {/* 內容介紹 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>動態內容 DNA (DCDV)</h2>
        <ul style={styles.ul}>
          <li>短影音 = 你的動態DNA，每秒畫面都是智慧財產</li>
          <li>透過區塊鏈 + AI 指紋辨識，再怎麼裁剪、變速、加字幕，都能精準比對！</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>靜態內容 DNA (SCDV)</h2>
        <ul style={styles.ul}>
          <li>圖片、攝影、插畫，都擁有專屬著作DNA</li>
          <li>AI 圖片指紋比對，確保作品不被盜用</li>
          <li>企業可 API 一鍵監測全網！</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>侵權通知 &amp; DMCA 自動申訴</h2>
        <ul style={styles.ul}>
          <li>發現盜用，第一時間通知</li>
          <li>自動 DMCA 申訴，24 小時內下架</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>區塊鏈存證</h2>
        <ul style={styles.ul}>
          <li>以 ETH 私有鏈確保不可竄改證據</li>
          <li>影片、圖片、圖文皆可上鏈</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>企業 API 服務</h2>
        <ul style={styles.ul}>
          <li>給企業級客戶的內容監測工具</li>
          <li>批量監測品牌、攝影作品的未授權使用</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>訴訟機制</h2>
        <ul style={styles.ul}>
          <li>遇到惡意侵權，可直接發起訴訟</li>
          <li>費用 NT$9000/件，若贏得賠償，平台抽 20%</li>
        </ul>
      </div>

      {/* 底部 CTA: 引導用戶去 Pricing, 或去 Login/Register */}
      <div style={styles.ctaArea}>
        <p>馬上查看 <Link to="/pricing" style={styles.link}>方案定價</Link> 或 <Link to="/login" style={styles.link}>登入</Link> 開始維權！</p>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    maxWidth: '960px',
    margin: '2rem auto',
    padding: '1rem',
    color: '#fff'
  },
  heroSection: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.4rem',
    marginBottom: '1rem',
    color: 'orange'  // 可依需求修改
  },
  subtitle: {
    fontSize: '1.2rem',
    lineHeight: '1.5'
  },
  highlightOrange: {
    color: 'orange',
    fontWeight: 'bold'
  },
  flameRow: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem'
  },
  flame: {
    fontSize: '2rem'
  },
  section: {
    marginBottom: '1.5rem',
    background: 'rgba(0,0,0,0.3)',
    padding: '0.8rem',
    borderRadius: '4px'
  },
  sectionTitle: {
    fontSize: '1.4rem',
    marginBottom: '0.5rem',
    color: '#00d4ff' // 藍色
  },
  ul: {
    paddingLeft: '1.5rem',
    lineHeight: '1.6'
  },
  ctaArea: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '1.1rem'
  },
  link: {
    color: '#ffcccc',
    textDecoration: 'underline'
  }
};
