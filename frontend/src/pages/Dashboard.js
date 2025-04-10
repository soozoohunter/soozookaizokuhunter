// frontend/src/pages/Dashboard.js
import React from 'react';

export default function Dashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#fff' }}>
        <h2>尚未登入</h2>
        <p>請先登入後再使用本功能</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>歡迎進入侵權者獵場</h2>
      <p style={styles.subtitle}>您可以上傳動態短影音檔或靜態照片圖檔，並檢視歷史資料</p>

      <div style={styles.splitContainer}>
        {/* 動態短影音 */}
        <div style={styles.leftPane}>
          <h3>動態短影音(短片) 上傳</h3>
          <p>可上傳30秒內短片，產生指紋並上鏈</p>
          <button
            style={styles.button}
            onClick={() => { window.location.href = '/upload?type=shortVideo'; }}
          >
            前往動態短影音上傳
          </button>
        </div>

        {/* 靜態圖檔 */}
        <div style={styles.rightPane}>
          <h3>靜態圖檔 上傳</h3>
          <p>可上傳靜態圖檔，系統產生指紋並上鏈</p>
          <button
            style={styles.button}
            onClick={() => { window.location.href = '/upload?type=ecommerce'; }}
          >
            前往靜態圖檔/商品照片上傳
          </button>
        </div>
      </div>

      {/* 歷史 / 訴訟 */}
      <div style={styles.historySection}>
        <h3>我的上傳紀錄 / 訴訟列表</h3>
        <p>可前往 <a href="/infringements" style={{ color:'#fff' }}>侵權列表</a> 查看</p>
        <p>或查看訴訟進度 …</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '1rem',
    color: '#fff',
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '6px'
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '1rem',
    color: '#ff1c1c'
  },
  subtitle: {
    marginBottom: '2rem'
  },
  splitContainer: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem'
  },
  leftPane: {
    flex: 1,
    border: '1px solid #ff1c1c',
    padding: '1rem',
    borderRadius: '4px'
  },
  rightPane: {
    flex: 1,
    border: '1px solid #ff1c1c',
    padding: '1rem',
    borderRadius: '4px'
  },
  button: {
    marginTop: '1rem',
    backgroundColor: '#ff1c1c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  historySection: {
    borderTop: '1px solid #666',
    paddingTop: '1rem'
  }
};
