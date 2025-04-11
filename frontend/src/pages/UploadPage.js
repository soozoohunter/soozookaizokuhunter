// frontend/src/pages/UploadPage.js
import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpload = async(e) => {
    e.preventDefault();
    if(!file) {
      alert('請選擇檔案');
      return;
    }
    const token = localStorage.getItem('token');
    if(!token) {
      alert('尚未登入');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const res = await fetch('/api/upload', {
        method:'POST',
        headers: {
          'Authorization': 'Bearer ' + token
          // 不要加 'Content-Type'
        },
        body: formData
      });
      const data = await res.json();
      if(res.ok) {
        setMsg(`上傳成功！\n檔名: ${data.fileName}\nfingerprint: ${data.fingerprint}\nplan: ${data.plan}\n(影片:${data.usedVideos} / 圖片:${data.usedImages})`);
      } else {
        setMsg(`上傳失敗: ${data.error || '未知錯誤'}`);
      }
    } catch(err) {
      setMsg(`發生錯誤: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2>上傳作品 (動態短影音 / 靜態圖檔)</h2>
      <form onSubmit={handleUpload} style={styles.form}>
        <div style={styles.formGroup}>
          <label>作品標題：</label>
          <input 
            type="text"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            style={styles.input}
            placeholder="輸入著作權（作品）標題"
          />
        </div>
        <div style={styles.formGroup}>
          <label>選擇檔案：</label>
          <input 
            type="file"
            onChange={e=>setFile(e.target.files[0])}
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>上傳</button>
      </form>
      {msg && (
        <pre style={{ marginTop:'1rem', color:'yellow', whiteSpace:'pre-wrap' }}>
          {msg}
        </pre>
      )}
    </div>
  );
}

const styles = {
  container:{
    maxWidth:'500px',
    margin:'40px auto',
    padding:'20px',
    border:'1px solid #ccc',
    borderRadius:'8px',
    background:'#111',
    color:'#fff'
  },
  form:{
    display:'flex',
    flexDirection:'column'
  },
  formGroup:{
    marginBottom:'10px'
  },
  input:{
    marginTop:'5px',
    padding:'6px',
    borderRadius:'4px',
    border:'1px solid #666'
  },
  button:{
    padding:'8px 16px',
    backgroundColor: '#ff1c1c',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    cursor:'pointer'
  }
};
