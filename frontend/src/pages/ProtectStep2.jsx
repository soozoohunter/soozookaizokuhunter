// frontend/src/pages/ProtectStep2.jsx (Final Version)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components'; // 假設你已定義樣式

// --- 建議的樣式，或使用你現有的 ---
const PageWrapper = styled.div`/* ... */`;
const Container = styled.div`/* ... */`;
const Title = styled.h2`/* ... */`;
const InfoBlock = styled.div`/* ... */`;
const ButtonRow = styled.div`/* ... */`;
const OrangeButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background-color: #ea580c;
  }
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 優先從 location.state 獲取數據，其次才從 localStorage 獲取
  const [step1Data, setStep1Data] = useState(location.state?.step1Data || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 如果 state 中沒有數據 (例如使用者重新整理了此頁面)，則嘗試從 localStorage 回復
    if (!step1Data) {
      const storedData = localStorage.getItem('protectStep1');
      if (storedData) {
        setStep1Data(JSON.parse(storedData));
      } else {
        // 如果無任何資料，返回第一步
        alert('找不到上一步的資料，請重新上傳。');
        navigate('/protect/step1');
      }
    }
  }, [step1Data, navigate]);

  const handleProceedToScan = async () => {
    if (!step1Data || !step1Data.file || !step1Data.file.id) {
      alert('錯誤：無效的檔案資訊，無法啟動掃描。');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/protect/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: step1Data.file.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '啟動掃描任務失敗。');
      }

      const data = await response.json();
      
      // 關鍵: 將 taskId 和完整的 step1Data 傳遞給下一個頁面
      navigate('/protect/step3', {
        state: {
          taskId: data.taskId,
          fileInfo: step1Data.file, 
          userInfo: step1Data.user 
        },
      });
    } catch (error) {
      console.error('Failed to dispatch scan:', error);
      alert(`啟動掃描失敗：${error.message}`);
      setIsLoading(false);
    }
  };

  if (!step1Data) {
    return (
      <PageWrapper>
        <Container><Title>正在載入資料...</Title></Container>
      </PageWrapper>
    );
  }

  const { file } = step1Data;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 憑證已生成</Title>
        <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '1.5rem' }}>
          您的原創著作證明已成功建立並儲存於區塊鏈上。
        </p>
        <InfoBlock>
          <p><strong>檔案 ID:</strong> {file.id || 'N/A'}</p>
          <p><strong>數位指紋 (SHA-256):</strong> {file.fingerprint || 'N/A'}</p>
          <p><strong>IPFS Hash:</strong> {file.ipfs_hash || 'N/A'}</p>
          <p><strong>區塊鏈交易 Hash:</strong> {file.tx_hash || 'N/A'}</p>
        </InfoBlock>
        <ButtonRow>
          <OrangeButton onClick={handleProceedToScan} disabled={isLoading}>
            {isLoading ? '處理中...' : '下一步：開始侵權偵測 →'}
          </OrangeButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
