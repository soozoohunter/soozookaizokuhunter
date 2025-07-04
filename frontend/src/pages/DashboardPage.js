// frontend/src/pages/DashboardPage.js (UI 優化與錯誤處理強化版)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import BulkUploader from '../components/BulkUploader.jsx';

// 簡單的卡片樣式元件
const Card = ({ children, title }) => (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    {children}
  </div>
);

// 儀表板主頁面
function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkUploader, setShowBulkUploader] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('驗證無效，請重新登入。');
      return;
    };

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          // 嘗試解析後端回傳的錯誤訊息
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || `伺服器錯誤: ${res.status}`);
        }
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || '無法載入會員資料，請稍後再試。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token]);

  if (isLoading) {
    return <div style={styles.pageContainer}><h2>載入中...</h2></div>;
  }

  if (error) {
    return (
        <div style={styles.pageContainer}>
            <Card title="錯誤">
                <p style={{color: '#F87171'}}>{error}</p>
            </Card>
        </div>
    );
  }

  if (!dashboardData) {
    return null; // 或者顯示一個空狀態
  }
  
  const { userInfo, planInfo, usage, protectedContent, recentScans } = dashboardData;

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.pageTitle}>Hi, {userInfo.realName || userInfo.email}! 歡迎來到您的儀表板</h2>
      {/* [新增] 批量上傳按鈕 */}
      <button style={styles.batchUploadButton} onClick={() => setShowBulkUploader(true)}>
        + 批量保護新內容
      </button>
      <div style={styles.grid}>
        <Card title="方案總覽">
          <p><strong>當前方案:</strong> {planInfo.name}</p>
          <p><strong>到期日:</strong> {planInfo.expires_at ? new Date(planInfo.expires_at).toLocaleDateString() : 'N/A'}</p>
           {/* 在此處可以加上升級按鈕 */}
        </Card>

        <Card title="用量分析">
            <p>圖片上傳: {usage.images.used} / {usage.images.limit ?? '無限制'}</p>
            <p>每月掃描: {usage.monthlyScan.used} / {usage.monthlyScan.limit ?? '無限制'}</p>
            <p>每月DMCA: {usage.monthlyDmca.used} / {usage.monthlyDmca.limit ?? '無限制'}</p>
        </Card>
        
        <Card title="已保護內容">
            {protectedContent.length > 0 ? (
                <ul>{protectedContent.map(file => <li key={file.fileId}>{file.fileName}</li>)}</ul>
            ) : <p>您尚未保護任何內容。</p>}
        </Card>

        <Card title="最近掃描活動">
            {recentScans.length > 0 ? (
                 <ul>{recentScans.map(scan => <li key={scan.scanId}>{scan.fileName} - {scan.status}</li>)}</ul>
            ) : <p>沒有最近的掃描活動。</p>}
        </Card>
      </div>
      {showBulkUploader && (
        <div style={styles.modalOverlay}>
          <BulkUploader onClose={() => setShowBulkUploader(false)} />
        </div>
      )}
    </div>
  );
}

// 儀表板頁面的專屬樣式
const styles = {
    pageContainer: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
    pageTitle: {
        fontSize: '2rem',
        color: '#FFFFFF',
        marginBottom: '2rem',
        borderBottom: '1px solid #374151',
        paddingBottom: '1rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
    },
    card: {
        backgroundColor: '#1F2937', // 較亮的深藍灰
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #374151',
    },
    batchUploadButton: {
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    cardTitle: {
        margin: '0 0 1rem 0',
        fontSize: '1.25rem',
        color: '#F3F4F6',
    }
};

export default DashboardPage;
