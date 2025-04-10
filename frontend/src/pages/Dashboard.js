// 文件路徑: frontend/src/pages/Dashboard.js

import React from 'react';

export default function Dashboard() {
  // 檢查 token
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#fff' }}>
        <h2>尚未登入</h2>
        <p>請先登入後再使用本功能</p>
      </div>
    );
  }

  // 額外從 localStorage 讀取 userName & userRole
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'COPYRIGHT'; 
  // 若後端登入成功時有回傳 userName, userRole，請前端存 localStorage.setItem('userName', ...)

  // 點擊「前往商標上傳」(若 userRole = 'TRADEMARK' or 'BOTH')
  const goTrademarkUpload = () => {
    window.location.href = '/upload?type=trademark';
  };

  return (
    <div style={styles.container}>
      {/* 顯示使用者暱稱 / 角色 */}
      <h2 style={styles.title}>歡迎，{userName}</h2>
      <p style={styles.subtitle}>
        您的角色：{userRole} 
      </p>

      <div style={styles.splitContainer}>
        {/* 動態短影音 */}
        <div style={styles.leftPane}>
          <h3>動態短影音(短片) 上傳</h3>
          <p>可上傳 30 秒內短片，產生指紋並上鏈</p>
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
          <p>可上傳靜態圖檔(商品照片)、系統產生指紋並上鏈</p>
          <button
            style={styles.button}
            onClick={() => { window.location.href = '/upload?type=ecommerce'; }}
          >
            前往靜態圖檔上傳
          </button>
        </div>
      </div>

      {/* 如果角色包含商標 (TRADEMARK / BOTH)，顯示商標上傳區塊 */}
      {(userRole === 'TRADEMARK' || userRole === 'BOTH') && (
        <div style={styles.trademarkSection}>
          <h3>商標圖案 上傳</h3>
          <p>可上傳商標圖案，做侵權偵測 / 或申請前預檢索</p>
          <button style={styles.button} onClick={goTrademarkUpload}>
            前往商標圖上傳
          </button>
        </div>
      )}

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
  trademarkSection: {
    border: '1px solid #ff1c1c',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '2rem'
  },
  historySection: {
    borderTop: '1px solid #666',
    paddingTop: '1rem'
  }
};
