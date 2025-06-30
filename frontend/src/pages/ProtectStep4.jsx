import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;
const Container = styled.div`
  width: 95%;
  max-width: 600px;
  background: rgba(30, 30, 30, 0.8);
  padding: 2rem;
  border-radius: 8px;
  border: 2px solid #ff6f00;
`;
const Title = styled.h2`
  color: #ffd700;
  margin-bottom: 1rem;
`;
const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #ff6f00;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;
const NavButton = styled.button`
  background-color: #f97316;
  color: #fff;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();

  const { confirmedLinks, fileInfo, userInfo } = location.state || {};

  if (!confirmedLinks || confirmedLinks.length === 0 || !fileInfo) {
    return (
      <PageWrapper>
        <Container>
          <Title>錯誤</Title>
          <p>沒有傳入有效的申訴連結資訊，請返回上一步重試。</p>
          <ButtonRow>
            <NavButton onClick={() => navigate('/protect/step1')}>返回第一步</NavButton>
          </ButtonRow>
        </Container>
      </PageWrapper>
    );
  }

  const handleTakedown = async (infringingUrl) => {
    if (!window.confirm(`確定要對以下連結發起 DMCA 申訴嗎？\n${infringingUrl}`)) return;

    try {
      const response = await fetch('/api/infringement/takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFileId: fileInfo.id,
          infringingUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '申訴請求失敗');
      alert(`申訴已成功提交！案件 ID: ${result.caseId}`);
    } catch (error) {
      alert(`申訴失敗：${error.message}`);
    }
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 4: 查看報告與進行申訴</Title>
        <InfoBlock>
          <h4>您已確認以下連結為侵權內容：</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {confirmedLinks.map((link, index) => (
              <li key={index} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ wordBreak: 'break-all', flexGrow: 1 }}>{link}</span>
                <button onClick={() => handleTakedown(link)}>發送 DMCA 申訴</button>
              </li>
            ))}
          </ul>
        </InfoBlock>
        <ButtonRow>
          <NavButton onClick={() => navigate(-1)}>← 返回修改</NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
