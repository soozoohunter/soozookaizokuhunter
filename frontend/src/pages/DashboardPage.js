// frontend/src/pages/DashboardPage.js (修正版)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        // [FIX] 呼叫我們新建的儀表板核心 API
        const res = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`伺服器錯誤: ${res.status}`);
        }
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('無法載入會員資料，請稍後再試。');
      }
    };
    
    fetchDashboardData();
  }, [token]);

  if (error) {
    return <div className="dashboard-page"><h2>錯誤</h2><p>{error}</p></div>;
  }

  if (!dashboardData) {
    return <div className="dashboard-page"><h2>載入中...</h2></div>;
  }

  // 根據從 /api/dashboard 回傳的資料結構來渲染頁面
  const { userInfo, protectedContent, recentScans } = dashboardData;

  return (
    <div className="dashboard-page" style={{ padding: '2rem' }}>
      <h2>{userInfo.realName || userInfo.email} 的儀表板</h2>
      
      <div className="plan-overview">
        <h3>方案與用量</h3>
        <p>當前方案: {userInfo.planInfo.name}</p>
        <p>到期日: {new Date(userInfo.planInfo.expires_at).toLocaleDateString()}</p>
        {/* 在此處渲染用量進度條 */}
      </div>

      <div className="protected-content">
        <h3>已保護的內容</h3>
        {/* 在此處渲染 protectedContent 列表 */}
      </div>

      <div className="recent-scans">
        <h3>最近的掃描活動</h3>
        {/* 在此處渲染 recentScans 列表 */}
      </div>
    </div>
  );
}

export default DashboardPage;
