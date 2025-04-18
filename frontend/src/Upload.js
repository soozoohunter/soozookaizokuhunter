// frontend/src/Upload.js
import React, { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setMsg('上傳中...');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('尚未登入');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('上傳完成');
        setResult(data);
      } else {
        setMsg(data.detail || data.message || '上傳失敗');
      }
    } catch (err) {
      console.error(err);
      setMsg('發生錯誤');
    }
  };

  return (
    <div style={{ padding: '2em' }}>
      <h3>上傳檔案</h3>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>上傳</button>
      <p>{msg}</p>
      {result && (
        <div style={{ marginTop: '1em' }}>
          <p>IPFS CID: {result.ipfs_cid}</p>
          <p>Cloud URL: {result.cloudinary_url}</p>
          <p>Fingerprint: {result.fingerprint}</p>
          <p>Tx Hash: {result.tx_hash}</p>
          {result.matches && result.matches.length > 0 && (
            <div>
              <p>疑似侵權連結：</p>
              <ul>
                {result.matches.map((m, i) => (
                  <li key={i}><a href={m} target="_blank" rel="noreferrer">{m}</a></li>
                ))}
              </ul>
            </div>
          )}
          {result.certificate_url && (
            <p>DMCA 證明: <a href={result.certificate_url} target="_blank" rel="noopener noreferrer">下載 PDF</a></p>
          )}
        </div>
      )}
    </div>
  );
}
