import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 600px;
  width: 90%;
  text-align: center;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
`;

const PlanCard = styled.div`
  border: 1px solid ${({ featured }) => (featured ? '#4285f4' : '#ddd')};
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  ${({ featured }) =>
    featured && `
      border-width: 2px;
      box-shadow: 0 0 0 2px rgba(66,133,244,0.2);
    `}
`;

const PlanTitle = styled.h3`
  margin-top: 0;
  color: ${({ featured }) => (featured ? '#4285f4' : '#333')};
`;

const PlanPrice = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
  color: ${({ featured }) => (featured ? '#4285f4' : '#333')};
  span {
    font-size: 1rem;
    font-weight: normal;
    color: #666;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  text-align: left;
  min-height: 200px;
  li {
    margin-bottom: 0.8rem;
    position: relative;
    padding-left: 25px;
    &:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: ${({ featured }) => (featured ? '#4285f4' : '#34a853')};
    }
  }
`;

const PlanButton = styled.button`
  background: ${({ featured }) => (featured ? '#4285f4' : '#f8f9fa')};
  color: ${({ featured }) => (featured ? 'white' : '#333')};
  border: 1px solid ${({ featured }) => (featured ? '#4285f4' : '#dadce0')};
  border-radius: 24px;
  padding: 0.8rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  transition: all 0.2s ease;
  &:hover {
    background: ${({ featured }) => (featured ? '#3367d6' : '#f1f3f4')};
  }
`;

export default function ExperienceCompleteModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <Overlay>
      <ModalContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2>🎉 免費體驗完成！</h2>
        <p>您已成功體驗我們的著作權保護服務，升級專業版解鎖完整功能：</p>
        <PlanGrid>
          <PlanCard>
            <PlanTitle>CREATOR</PlanTitle>
            <PlanPrice>NT$390<span>/月</span></PlanPrice>
            <FeatureList>
              <li><strong>100</strong> 件作品存證</li>
              <li>每月 <strong>10</strong> 次 AI 掃描</li>
              <li><strong>完整侵權報告</strong></li>
              <li>每月 <strong>1</strong> 次 DMCA 下架</li>
            </FeatureList>
            <PlanButton onClick={() => navigate('/pricing')}>選擇此方案</PlanButton>
          </PlanCard>
          <PlanCard featured>
            <PlanTitle featured>PROFESSIONAL</PlanTitle>
            <PlanPrice featured>NT$1,490<span>/月</span></PlanPrice>
            <FeatureList>
              <li><strong>500</strong> 件作品存證</li>
              <li>每月 <strong>50</strong> 次 AI 掃描</li>
              <li><strong>批量處理工具</strong></li>
              <li>每月 <strong>5</strong> 次 DMCA 下架</li>
            </FeatureList>
            <PlanButton featured onClick={() => navigate('/pricing')}>立即升級</PlanButton>
          </PlanCard>
        </PlanGrid>
        <div style={{ marginTop: '1.5rem' }}>
          <p>
            <small>
              限時優惠：首次升級享 <strong>85折</strong> 優惠！
              輸入優惠碼 <code>WELCOME15</code>
            </small>
          </p>
        </div>
      </ModalContent>
    </Overlay>
  );
}
