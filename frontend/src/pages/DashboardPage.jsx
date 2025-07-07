// frontend/src/pages/DashboardPage.jsx (整合新版 Uploader)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import FileCard from '../components/FileCard';
import BulkUploader from '../components/BulkUploader'; // 引入新的 Uploader
import styled from 'styled-components';

// 主元件
function DashboardPage() {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
        // ... (省略 fetch 邏輯，保持不變)
    } catch (err) {
        // ... (省略 error 處理，保持不變)
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  // ... (省略 handleRescan, isLoading, error 等 JSX 渲染邏輯，保持不變) ...

  const { userInfo, protectedContent } = dashboardData || {};

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.pageTitle}>Hi, {userInfo?.realName || userInfo?.email}! 歡迎來到您的儀表板</h2>
      
      {/* 方案與用量分析卡片 */}
      <div style={styles.grid}>
        {/* ... Card for Plan ... */}
        {/* ... Card for Usage ... */}
      </div>

      {/* [升級] 直接將新的 Uploader 元件放在這裡 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>+ 批量保護新內容</h3>
        <BulkUploader onUploadComplete={fetchDashboardData} />
      </div>
      
      {/* 已保護內容區塊 */}
      <div style={styles.section}>
          <h3 style={styles.sectionTitle}>已保護內容</h3>
          {protectedContent && protectedContent.length > 0 ? (
              <div style={styles.filesGrid}>
                  {protectedContent.map(file => (
                      <FileCard key={file.fileId} file={file} onScan={handleRescan} />
                  ))}
              </div>
          ) : (
            <p>您尚未保護任何內容。請使用上方功能開始保護您的第一個作品！</p>
          )}
      </div>
    </div>
  );
}

// ... (省略 styles，請保持您現有的美化版本)
const styles = { /* ... */ };

export default DashboardPage;
