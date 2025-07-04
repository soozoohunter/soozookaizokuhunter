/***************************************************************
 * frontend/src/pages/AdminDashboard.jsx
 * - 管理後台簡易示範：查看使用者 / 上傳檔案列表 / Overview 統計
 ***************************************************************/
import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [token] = useState(localStorage.getItem('token') || '');
  const [error, setError] = useState('');
  
  // users, files => 舊有
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  
  // 新增 stats 狀態
  const [stats, setStats] = useState(null);

  // section: "overview" / "users" / "files"
  const [section, setSection] = useState('overview');

  useEffect(() => {
    if (!token) {
      setError('Admin JWT 不存在，請先登入管理後台');
    } else {
      // 預設顯示 overview
      handleSectionChange('overview');
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError('無法取得 Overview 統計資料');
      console.error('[fetchStats Error]', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('無法取得使用者列表');
      console.error('[fetchUsers Error]', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/admin/files', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      setError('無法取得上傳檔案列表');
      console.error('[fetchFiles Error]', err);
    }
  };

  const handleSectionChange = (sec) => {
    setSection(sec);
    setError('');
    if (sec === 'overview') fetchStats();
    if (sec === 'users') fetchUsers();
    if (sec === 'files') fetchFiles();
  };

  if (!token) {
    return (
      <div style={{ padding: '2rem', color: '#fff' }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: 'red' }}>{error || '請先登入 Admin 才能瀏覽此頁面'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h2 style={{ color: '#ff6f00' }}>Admin Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => handleSectionChange('overview')} style={btnStyle}>Overview</button>
        <button onClick={() => handleSectionChange('users')} style={btnStyle}>View Users</button>
        <button onClick={() => handleSectionChange('files')} style={btnStyle}>View Files</button>
      </div>

      {/* === Overview 區塊 === */}
      {section === 'overview' && (
        <div>
          <h3>Overview (系統使用狀況)</h3>
          {!stats && <p>Loading stats...</p>}
          {stats && (
            <ul>
              <li>總使用者數 (totalUsers): {stats.totalUsers}</li>
              <li>總管理員數 (totalAdmins): {stats.totalAdmins}</li>
              <li>總檔案數 (totalFiles): {stats.totalFiles}</li>
              <li>累計上傳圖片數 (sumImages): {stats.sumImages}</li>
              <li>累計上傳影片數 (sumVideos): {stats.sumVideos}</li>
              <li>侵權檔案數 (totalInfringing): {stats.totalInfringing}</li>
            </ul>
          )}
        </div>
      )}

      {/* === Users 區塊 === */}
      {section === 'users' && (
        <div>
          <h3>Users List</h3>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                [ID={u.id}] Email={u.email}, Username={u.username}, Phone={u.phone}, Role={u.role}, 
                <br />
                uploadImages={u.uploadImages}, uploadVideos={u.uploadVideos}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* === Files 區塊 === */}
      {section === 'files' && (
        <div>
          <h3>Uploaded Files</h3>
          <ul>
            {files.map((f) => (
              <li key={f.id}>
                [FileID={f.id}] filename={f.filename}, user_id={f.user_id}, fingerprint={f.fingerprint}, 
                infringingLinks={f.infringingLinks || 'null'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  marginRight: '1rem',
  padding: '0.5rem 1rem',
  backgroundColor: '#ff6f00',
  border: 'none',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer'
};
