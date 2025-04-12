// src/pages/UploadPage.js
import React, { useState } from 'react';

export default function UploadPage(){
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const doUpload= async()=>{
    if(!file){
      alert('請選擇檔案');
      return;
    }
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const resp = await fetch('/api/upload',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+ localStorage.getItem('token')
        },
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('上傳成功: '+ JSON.stringify(data));
      } else {
        setMsg('上傳失敗: '+ (data.error||''));
      }
    } catch(e){
      setMsg('發生錯誤: '+ e.message);
    }
  };

  return (
    <div>
      <h2>上傳作品 (動態短影音 / 圖片)</h2>
      <div style={{ margin:'0.5rem 0' }}>
        <label>作品標題: </label>
        <input 
          value={title} 
          onChange={e=>setTitle(e.target.value)} 
          placeholder="輸入作品標題"
        />
      </div>
      <div style={{ margin:'0.5rem 0' }}>
        <label>選擇檔案: </label>
        <input 
          type="file" 
          onChange={e=> setFile(e.target.files[0])}
        />
      </div>
      <button onClick={doUpload}>上傳</button>
      {msg && <p style={{ marginTop:'1rem', color:'yellow' }}>{msg}</p>}
    </div>
  );
}
