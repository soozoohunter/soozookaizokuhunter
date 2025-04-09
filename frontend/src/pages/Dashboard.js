// frontend/src/pages/Dashboard.js
import React from 'react';

export default function Dashboard() {
  // 檢查是否有 token
  const token = localStorage.getItem('token');

  // 簡單判斷：若沒 token 就提示
  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#fff' }}>
        <h2>尚未登入</h2>
        <p>請先登入後再使用本功能</p>
      </div>
    );
  }

  // 已登入 => 顯示 dashboard
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>歡迎進入我的獵場</h2>
      <p style={styles.subtitle}>您可以上傳短影音或商品照片，並檢視歷史資料</p>

      <div style={styles.splitContainer}>
        {/* 左欄：短影音上傳 */}
        <div style={styles.leftPane}>
          <h3>短影音 (短片) 上傳</h3>
          <p>您可以上傳 30 秒內的短影音，用於產生指紋哈希並存證</p>
          <button
            style={styles.button}
            onClick={() => { window.location.href = '/upload?type=shortVideo'; }}
          >
            前往短影音上傳
          </button>
        </div>

        {/* 右欄：商品照片上傳 */}
        <div style={styles.rightPane}>
          <h3>商品照片 上傳</h3>
          <p>您可以上傳商品圖，系統會產生靜態指紋哈希並上鏈</p>
          <button
            style={styles.button}
            onClick={() => { window.location.href = '/upload?type=ecommerce'; }}
          >
            前往商品照片上傳
          </button>
        </div>
      </div>

      {/* 下面再來個「歷史列表 / 訴訟 / DMCA」區塊 */}
      <div style={styles.historySection}>
        <h3>我的上傳紀錄 / 訴訟列表</h3>
        <p>可前往 <a href="/infringements">侵權列表</a> 查看</p>
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
