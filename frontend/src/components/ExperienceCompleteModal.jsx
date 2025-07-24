import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000;
`;
const ModalContent = styled.div`
  background: white; border-radius: 16px; padding: 2.5rem;
  max-width: 800px; width: 90%; text-align: center; position: relative;
`;
const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: none;
  border: none; font-size: 1.5rem; cursor: pointer;
`;
const PlanGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin: 2rem 0;
  @media(max-width: 768px) { grid-template-columns: 1fr; }
`;
const Card = styled.div`
  border: 2px solid ${({ featured }) => (featured ? '#D45398' : '#E5E7EB')};
  border-radius: 12px; padding: 1.5rem; position: relative;
  display: flex; flex-direction: column; text-align: left;
`;
const PlanName = styled.h3`
  font-size: 1.2rem; font-weight: 700; color: #111827;
  line-height: 1.4; min-height: 3.5rem; display: flex;
  align-items: center; justify-content: center; text-align: center;
`;
const PlanPrice = styled.div` font-size: 2rem; font-weight: bold; text-align: center; margin: 1rem 0; span { font-size: 1rem; font-weight: normal; color: #666; }`;
const FeatureList = styled.ul` list-style: '✓'; padding-left: 1.5rem; flex-grow: 1; margin: 1.5rem 0; li { margin-bottom: 0.8rem; font-size: 0.9rem; } `;
const PlanButton = styled.button`
  background: ${({ featured }) => (featured ? '#D45398' : '#A855F7')};
  color: #FFFFFF; border: none; border-radius: 24px; padding: 0.8rem 1.5rem;
  font-weight: bold; cursor: pointer; width: 100%; margin-top: auto;
`;

export default function ExperienceCompleteModal({ onClose }) {
  const navigate = useNavigate();
  const handleChoosePlan = (planCode, price) => {
    onClose(); 
    navigate(`/payment?plan=${planCode}&price=${price}`);
  };

  return (
    <Overlay>
      <ModalContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2>🎉 您的侵權摘要報告已生成！</h2>
        <p>升級方案以解鎖完整報告、P2P 變現引擎與更多強大功能：</p>
        <PlanGrid>
          <Card>
            <PlanName>創意守護者</PlanName>
            <PlanPrice>NT$490<span>/月</span></PlanPrice>
            <FeatureList>
              <li><strong>100</strong> 件作品存證</li>
              <li>每月 <strong>10</strong> 次掃描</li>
              <li>基本盜版追蹤</li>
              <li>✓ P2P 收益共享</li>
            </FeatureList>
            <PlanButton onClick={() => handleChoosePlan('BASIC', 490)}>選擇此方案</PlanButton>
          </Card>
          <Card featured>
            <PlanName>專業捍衛者</PlanName>
            <PlanPrice>NT$790<span>/月</span></PlanPrice>
            <FeatureList>
              <li><strong>300</strong> 件作品存證</li>
              <li>每月 <strong>30</strong> 次掃描</li>
              <li>深度盜版分析</li>
              <li><strong>✓ 進階 P2P 引擎</strong></li>
            </FeatureList>
            <PlanButton featured onClick={() => handleChoosePlan('PRO', 790)}>升級此方案</PlanButton>
          </Card>
          <Card>
            <PlanName>全方位守護者</PlanName>
            <PlanPrice>NT$1,490<span>/月</span></PlanPrice>
            <FeatureList>
              <li><strong>500+</strong> 件作品存證</li>
              <li>每月 <strong>50</strong> 次掃描</li>
              <li>VIP 法律諮詢</li>
              <li><strong>旗艦 P2P</strong></li>
            </FeatureList>
            <PlanButton onClick={() => handleChoosePlan('ELITE', 1490)}>尊榮守護</PlanButton>
          </Card>
        </PlanGrid>
      </ModalContent>
    </Overlay>
  );
}
