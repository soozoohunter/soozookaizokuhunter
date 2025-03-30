import React, { useState } from 'react';

function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');

  // 讀取 ?type=ecommerce or ?type=shortVideo (非必要, 也可從 localStorage.role)
  const searchParams = new URLSearchParams(window.location.search);
  const userType = searchParams.get('type') || 'ecommerce';

  const doUpload = async () => {
    setMsg('');
    if(!file) {
      alert('請選擇檔案');
      return;
    }
    const token = localStorage.getItem('token');
    if(!token) {
      alert('尚未登入, 無法上傳');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const data = await resp.json();
      if(resp.ok) {
        setMsg(`上傳成功, fingerprint=${data.fingerprint}`);
      } else {
        setMsg(`上傳失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('上傳發生錯誤');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>{userType==='shortVideo' ? '上傳短影音(最多5部, 每部30秒內)' : '上傳商品照片(最多30張)'}</h2>
      <label>作品標題：</label><br/>
      <input value={title} onChange={e => setTitle(e.target.value)} /><br/><br/>
      <label>選擇檔案：</label><br/>
      <input type="file" onChange={e => setFile(e.target.files[0])} /><br/><br/>
      <button onClick={doUpload}>開始上傳</button>
      <p>{msg}</p>
    </div>
  );
}

export default Upload;
