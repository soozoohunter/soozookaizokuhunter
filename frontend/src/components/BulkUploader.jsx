import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

// 從掃描結果物件中萃取潛在連結，與 Step3 的邏輯保持一致
const extractLinks = (result) => {
  if (!result || !result.scan || !result.scan.reverseImageSearch) return [];
  const { googleVision, tineye, bing } = result.scan.reverseImageSearch;
  const links = [];
  if (googleVision?.success && Array.isArray(googleVision.links)) {
    googleVision.links.forEach((url) => links.push({ source: 'Google', url }));
  }
  if (tineye?.success && Array.isArray(tineye.matches)) {
    tineye.matches.forEach((m) => links.push({ source: 'TinEye', url: m.url }));
  }
  if (bing?.success && Array.isArray(bing.links)) {
    bing.links.forEach((url) => links.push({ source: 'Bing', url }));
  }
  const unique = new Map();
  links.forEach((l) => {
    if (typeof l.url === 'string' && l.url.trim() !== '') {
      unique.set(l.url, l);
    }
  });
  return Array.from(unique.values());
};

const BulkUploader = ({ onClose }) => {
  const { token } = useContext(AuthContext);

  // uploads 內部包含檔案與後續狀態
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).map((f) => ({
      file: f,
      name: f.name,
      status: 'pending',
      message: '',
      fileId: null,
      taskId: null,
      scanStatus: '',
      links: [],
      takedownStatus: {},
    }));
    setUploads(selected);
  };

  const handleUpload = async () => {
    if (uploads.length === 0) {
      alert('請先選擇檔案');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    uploads.forEach((u) => formData.append('files', u.file));

    try {
      const resp = await fetch('/api/protect/batch-protect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await resp.json();
      const updated = uploads.map((u) => {
        const r = data.results.find((res) => res.filename === u.name);
        return r
          ? { ...u, status: r.status, message: r.reason || '成功', fileId: r.fileId || null }
          : u;
      });
      setUploads(updated);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  const startScan = async (index) => {
    const u = uploads[index];
    if (!u.fileId) return;
    try {
      const resp = await fetch('/api/protect/step2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId: u.fileId }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || '啟動掃描失敗');
      }
      const data = await resp.json();
      const updated = [...uploads];
      updated[index] = { ...u, taskId: data.taskId, scanStatus: 'pending' };
      setUploads(updated);
      pollStatus(index, data.taskId);
    } catch (err) {
      alert(err.message);
    }
  };

  const pollStatus = (index, taskId) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/scans/status/${taskId}`);
        const data = await res.json();
        setUploads((prev) => {
          const copy = [...prev];
          const u = { ...copy[index] };
          if (data.status) u.scanStatus = data.status;
          if (data.result) {
            const resultObj = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            u.links = extractLinks(resultObj);
          }
          copy[index] = u;
          return copy;
        });
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(timer);
        }
      } catch {
        clearInterval(timer);
      }
    }, 5000);
  };

  const sendTakedown = async (index, url) => {
    const u = uploads[index];
    const updated = [...uploads];
    updated[index].takedownStatus[url] = 'sending';
    setUploads(updated);

    try {
      const resp = await fetch('/api/infringement/takedown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ originalFileId: u.fileId, infringingUrl: url }),
      });
      const data = await resp.json();
      const next = [...uploads];
      next[index].takedownStatus[url] = resp.ok ? `成功 (ID: ${data.caseId})` : `失敗: ${data.error}`;
      setUploads(next);
    } catch {
      const next = [...uploads];
      next[index].takedownStatus[url] = '發送失敗';
      setUploads(next);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#374151', borderRadius: '8px', maxHeight: '80vh', overflowY: 'auto' }}>
      <h4>選擇多個檔案進行保護</h4>
      <input type="file" multiple onChange={handleFileChange} />

      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? '上傳中...' : `上傳 ${uploads.length} 個檔案`}
      </button>
      <button onClick={onClose} style={{ marginLeft: '1rem' }}>關閉</button>

      <div style={{ marginTop: '1rem' }}>
        {uploads.map((u, idx) => (
          <div key={u.name} style={{ marginBottom: '1rem', borderBottom: '1px solid #555' }}>
            <div>
              <strong>{u.name}</strong>
              {u.status && (
                <span style={{ marginLeft: '1rem', color: u.status === 'success' ? 'lightgreen' : 'pink' }}>
                  - {u.status}: {u.message}
                </span>
              )}
            </div>
            {u.status === 'success' && !u.taskId && (
              <button onClick={() => startScan(idx)}>開始侵權偵測</button>
            )}
            {u.taskId && (
              <div style={{ marginTop: '0.5rem' }}>
                <span>掃描狀態: {u.scanStatus}</span>
              </div>
            )}
            {u.links && u.links.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                {u.links.map((l, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9', flexGrow: 1 }}>
                      [{l.source}] {l.url}
                    </a>
                    <button onClick={() => sendTakedown(idx, l.url)} disabled={u.takedownStatus[l.url] === 'sending'}>
                      {u.takedownStatus[l.url] || '發送 DMCA'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkUploader;
