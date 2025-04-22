// frontend/src/pages/TryProtect.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TryProtect() {
  const navigate = useNavigate();

  // 使用者上傳的檔案狀態
  const [file, setFile] = useState(null);
  // 作品標題
  const [title, setTitle] = useState('');
  // 錯誤訊息
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleNext = () => {
    // 檢查是否有上傳檔案、是否有輸入 title
    if (!file) {
      setError('請先上傳您的作品檔案');
      return;
    }
    if (!title.trim()) {
      setError('請輸入作品標題 (Content Title)');
      return;
    }
    // 清除錯誤訊息
    setError('');

    // ★ TODO: 您可以在這裡加一段「檔案先上傳到後端暫存」的 API 呼叫，
    //   或直接帶著 file & title 在下一步讓使用者付費 (例: query string)
    //   這裡先簡化 => 直接跳到 Step2
    const paramStr = `?item=download_certificate&price=99&title=${encodeURIComponent(title)}`;
    navigate(`/payment${paramStr}`);
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={{ color: '#ff6f00' }}>Step 1: Upload & Content Info</h2>

      <div style={{ margin: '1rem 0' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          選擇作品檔案 (e.g. 圖片、音檔、影片...):
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          style={{ color: '#fff' }}
        />
      </div>

      <div style={{ margin: '1rem 0' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          作品標題 / Content Title:
        </label>
        <input
          style={styles.input}
          placeholder="(必填) e.g. My Masterpiece"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <button style={styles.nextBtn} onClick={handleNext}>
        Next
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    color: '#fff',
    padding: '2rem',
    maxWidth: '500px',
    margin: '0 auto'
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #999',
    width: '100%',
    maxWidth: '300px'
  },
  nextBtn: {
    backgroundColor: '#ff6f00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};
