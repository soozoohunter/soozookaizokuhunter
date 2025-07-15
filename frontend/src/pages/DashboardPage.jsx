// frontend/src/pages/DashboardPage.jsx (互動邏輯最終版)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import apiClient, { setupResponseInterceptor } from '../services/apiClient';
import FileCard from '../components/FileCard';
import BulkUploader from '../components/BulkUploader';
import styled from 'styled-components';

function DashboardPage() {
  const { token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({ userInfo: null, protectedContent: [] });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkUploader, setShowBulkUploader] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '無法載入會員資料。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setupResponseInterceptor(logout);
    if (token) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [token, logout]);

  const handleRescan = async (fileId) => {
    // 步驟 1: 立即更新前端 UI，顯示為 "偵測中..."
    setDashboardData(prevData => {
      if (!prevData) return null;
      const newContent = prevData.protectedContent.map(file => {
        if (file.fileId === fileId) {
          const newScans = [
            { id: `pending-${Date.now()}`, status: 'pending' },
            ...(file.scans || [])
          ];
          return { ...file, scans: newScans };
        }
        return file;
      });
      return { ...prevData, protectedContent: newContent };
    });

    try {
      // 步驟 2: 向後端發送掃描請求
      const res = await apiClient.get(`/api/scan/${fileId}`);
      alert(res.data.message || '掃描任務已成功派發！');
      // 可以在此處設定一個延遲來刷新，或等待 WebSocket 的自動更新
    } catch (err) {
      alert(`掃描失敗: ${err.response?.data?.error || err.message}`);
      fetchDashboardData(); // 如果派發失敗，立即刷新以恢復正確狀態
    }
  };

  if (isLoading) return <div style={styles.pageContainer}><h2>載入中...</h2></div>;
  if (error) return <div style={styles.pageContainer}><p style={{color: 'red'}}>{error}</p></div>;
  if (!dashboardData.userInfo) return null;

  const { userInfo, protectedContent } = dashboardData;

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.pageTitle}>Hi, {dashboardData?.userInfo?.realName || dashboardData?.userInfo?.email}! 歡迎來到您的儀表板</h2>
      <button style={styles.batchUploadButton} onClick={() => setShowBulkUploader(true)}>
          + 批量保護新內容
      </button>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>已保護內容</h3>
        {protectedContent && protectedContent.length > 0 ? (
            <div style={styles.filesGrid}>
                {protectedContent.map(file => (
                    <FileCard key={file.fileId} file={file} onScan={handleRescan} />
                ))}
            </div>
        ) : <p>您尚未保護任何內容。請點擊上方按鈕開始保護您的第一個作品！</p>}
      </div>

      {showBulkUploader && (
        <div style={styles.modalOverlay}>
          <BulkUploader
            onClose={() => setShowBulkUploader(false)}
            onUploadComplete={() => {
              setShowBulkUploader(false);
              fetchDashboardData();
            }}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem',
    color: '#fff',
  },
  pageTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  batchUploadButton: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  section: {
    marginTop: '2rem',
  },
  sectionTitle: {
    marginBottom: '1rem',
  },
  filesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
};

export default DashboardPage;
