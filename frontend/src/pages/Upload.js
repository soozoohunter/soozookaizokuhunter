import React, { useState } from 'react';

function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');

  const doUpload = async() => {
    const token = localStorage.getItem('token');
    if(!token){
      alert('尚未登入，無法上傳');
      return;
    }
    if(!file){
      alert('尚未選擇檔案');
      return;
    }
    try{
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const resp = await fetch('/api/upload',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+ token
        },
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('上傳成功, fingerprint=' + data.fingerprint);
      } else {
        setMsg('上傳失敗: ' + data.error);
      }
    } catch(e){
      console.error(e);
      setMsg('上傳錯誤:' + e.message);
    }
  };

  return (
    <div style={{ margin:'2rem' }}>
      <h2>上傳檔案(短影音 / 商品照片)</h2>
      <label>標題: </label>
      <input value={title} onChange={e=>setTitle(e.target.value)} /><br/><br/>
      <input type="file" onChange={e=>setFile(e.target.files[0])} /><br/><br/>
      <button onClick={doUpload}>上傳</button>
      <p>{msg}</p>
    </div>
  );
}

export default Upload;
