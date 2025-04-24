// frontend/src/pages/Upload.jsx
import React, { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(''); // 若後端需要標題，可保留
  const [msg, setMsg] = useState('');

  // 檢查是否已登入
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div style={{ textAlign: 'center', color: '#fff', marginTop: '2rem' }}>
        <h2>尚未登入</h2>
        <p>請先登入後再使用上傳功能</p>
      </div>
    );
  }

  const doUpload = async () => {
    if (!file) {
      alert('請選擇檔案');
      return;
    }

    setMsg('上傳中...');
    try {
      // 建立 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title); // 若後端需要接收 title，則一起帶過去

      // 呼叫後端 /api/upload
      const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const data = await resp.json();

      if (!resp.ok) {
        setMsg('上傳失敗：' + (data.error || data.message || '未知錯誤'));
      } else {
        setMsg('上傳成功！指紋=' + (data.fingerprint || '(無)'));
      }
    } catch (err) {
      console.error(err);
      setMsg('上傳錯誤：' + err.message);
    }
  };

  return (
    <div style={{ margin: '2rem', maxWidth: '600px', color: '#fff' }}>
      <h2>上傳檔案 (例如 短影音 / 圖片)</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '8px' }}>標題（選填）: </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '6px' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ color: '#fff' }}
        />
      </div>

      <button onClick={doUpload} style={btnStyle}>
        上傳
      </button>

      {msg && <p style={{ marginTop: '1rem', color: '#0f0' }}>{msg}</p>}
    </div>
  );
}

const btnStyle = {
  backgroundColor: '#ff1c1c',
  color: '#fff',
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '4px',
};
