import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');

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
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if(res.ok) {
        alert(`上傳成功！Fingerprint=${data.fingerprint}`);
      } else {
        alert(`上傳失敗: ${data.error||'未知錯誤'}`);
      }
    } catch(err) {
      alert(`發生錯誤: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2>上傳作品</h2>
      <form onSubmit={handleUpload} style={styles.form}>
        <div style={styles.formGroup}>
          <label>作品標題：</label>
          <input 
            type="text"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            style={styles.input}
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
    </div>
  );
}

const styles = {
  container:{
    maxWidth:'500px', margin:'40px auto', padding:'20px',
    border:'1px solid #ccc', borderRadius:'8px'
  },
  form:{
    display:'flex', flexDirection:'column'
  },
  formGroup:{
    marginBottom:'10px'
  },
  input:{
    marginTop:'5px'
  },
  button:{
    padding:'8px 16px'
  }
};
