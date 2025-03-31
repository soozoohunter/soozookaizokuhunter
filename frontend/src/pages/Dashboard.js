import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'shortVideo';

  return (
    <div style={{ margin:'2rem' }}>
      <h2>Dashboard - 角色狀態</h2>
      <p>目前角色: {role}</p>
      <p>請選擇功能：</p>
      <button onClick={() => navigate('/upload')}>前往上傳頁面</button>
    </div>
  );
}

export default Dashboard;
