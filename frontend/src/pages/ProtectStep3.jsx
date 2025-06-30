// frontend/src/pages/ProtectStep3.jsx (Final Corrected Logic)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// ... (Styled components: PageWrapper, Container, Title, etc. remain the same)
const PageWrapper = styled.div`/* ... */`;
const Container = styled.div`/* ... */`;
const Title = styled.h1`/* ... */`;
const InfoBlock = styled.div`/* ... */`;
const ErrorMsg = styled.div`/* ... */`;
const ButtonRow = styled.div`/* ... */`;
const NavButton = styled.button`/* ... */`;
const spin = keyframes`/* ... */`;
const Spinner = styled.div`/* ... */`;


export default function ProtectStep3() {
  const navigate = useNavigate();
  const location = useLocation(); // Use location to get state passed from previous route

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [internalMatches, setInternalMatches] = useState([]);
  const [fileInfoMap, setFileInfoMap] = useState({});

  // Memoize high similarity matches to prevent re-calculations
  const highSimilarityMatches = React.useMemo(() => 
    (internalMatches || []).filter(m => m.score >= 0.8),
    [internalMatches]
  );

  // This effect fetches detailed info for matched files
  useEffect(() => {
    highSimilarityMatches.forEach(match => {
      if (!fileInfoMap[match.id]) {
        fetch(`/api/files/${match.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setFileInfoMap(prev => ({ ...prev, [match.id]: data }));
            }
          })
          .catch(console.error);
      }
    });
  }, [highSimilarityMatches, fileInfoMap]);

  // ** CORE LOGIC FIX **
  // This effect now ONLY starts polling based on a taskId passed from the previous page.
  useEffect(() => {
    // The taskId should be passed via `Maps` state from the component that triggers the scan
    const taskId = location.state?.taskId;
    
    if (!taskId) {
      setError('沒有提供掃描任務 ID。請返回上一步重試。');
      setLoading(false);
      return;
    }
    
    // Start polling for the result of the ALREADY CREATED task.
    pollScanStatus(taskId);

  }, [location.state]); // Depend on location.state

  // This function ONLY polls. It does not trigger a new scan.
  function pollScanStatus(taskId) {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes max (60 attempts * 5 seconds)
    
    const timer = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setError('掃描超時，請稍後再試。');
        setLoading(false);
        return;
      }
      attempts++;

      try {
        const res = await fetch(`/api/scans/status/${taskId}`);
        if (!res.ok) throw new Error(`無法取得掃描狀態 (HTTP ${res.status})`);
        
        const data = await res.json();
        
        if (data.status === 'completed') {
          clearInterval(timer);
          const resultData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setScanResult(resultData.scan);
          setInternalMatches(resultData.internalMatches?.results || []);
          localStorage.setItem('protectStep3', JSON.stringify(resultData));
          setLoading(false);
        } else if (data.status === 'failed') {
          clearInterval(timer);
          const resultError = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setError(`掃描任務失敗: ${resultError.error}`);
          setLoading(false);
        }
        // If status is 'pending' or 'processing', do nothing and wait for the next interval.
      } catch (err) {
        clearInterval(timer);
        setError(err.message || '無法取得掃描結果');
        setLoading(false);
      }
    }, 5000); // Poll every 5 seconds
  }
  
  // ... (Other functions like handleGoBack, handleGoStep4, handleDMCATakedown remain the same) ...
  const handleGoBack = () => { /* ... */ };
  const handleGoStep4 = () => { /* ... */ };
  const handleDMCATakedown = async (matchId) => { /* ... */ };
  
  const renderContent = () => {
    // ... (Your existing renderContent logic is mostly correct and can be reused) ...
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: AI Infringement Scan</Title>
        {/* Your renderContent function call here */}
        <ButtonRow>
          {/* ... Your buttons here ... */}
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
