import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div` background: #f1f5f9; min-height: 100vh; padding: 4rem 1rem; `;
const Container = styled.div` max-width: 800px; margin: auto; background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); `;
const Title = styled.h1` text-align: center; color: #b91c1c; `;
const EvidenceSection = styled.div` border: 1px solid #e2e8f0; padding: 1.5rem; margin: 2rem 0; border-radius: 8px; background: #f8fafc; `;
const ChoiceSection = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; @media(max-width: 768px) { grid-template-columns: 1fr; } `;
const ChoiceCard = styled.div` border: 2px solid ${({ good }) => (good ? '#16a34a' : '#b91c1c')}; padding: 1.5rem; border-radius: 8px; `;
const ActionButton = styled.button` width: 100%; padding: 1rem; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: bold; cursor: pointer; &:hover { background: #15803d; } `;

const ResolutionPage = () => {
    const { uniqueCaseId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const response = await apiClient.get(`/resolution/${uniqueCaseId}`);
                setCaseData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || '無法載入案件');
            }
        };
        fetchCase();
    }, [uniqueCaseId]);

    if (error) return <PageWrapper><Container><h1>錯誤</h1><p>{error}</p></Container></PageWrapper>;
    if (!caseData) return <PageWrapper><div>Loading...</div></PageWrapper>;
    
    if (caseData.status !== 'detected' && caseData.status !== 'offer_sent') {
        return <PageWrapper><Container><h1>案件已關閉</h1><p>此案件已被處理或已關閉。</p></Container></PageWrapper>;
    }

    const { infringingUrl, licensePrice, originalWork } = caseData;

    return (
        <PageWrapper>
            <Container>
                <Title>關於著作權利使用的重要通知</Title>
                <p>尊敬的網站管理者，您所營運的網站 <a href={infringingUrl} target="_blank" rel="noopener noreferrer">{infringingUrl}</a> 經 AI 系統偵測，疑似使用了以下受 SUZOO IP Guard 保護的數位著作，相關法律證據如下：</p>
                
                <EvidenceSection>
                    <h3>證據總覽 (不可篡改)</h3>
                    <p><strong>原創作者:</strong> {originalWork.author}</p>
                    <p><strong>原始檔名:</strong> {originalWork.filename}</p>
                    <p><strong>首次存證於:</strong> {new Date(originalWork.creationDate).toLocaleString('zh-TW')}</p>
                    <p><strong>區塊鏈交易 Hash:</strong> <a href={`https://etherscan.io/tx/${originalWork.txHash}`} target="_blank" rel="noopener noreferrer">{originalWork.txHash}</a></p>
                </EvidenceSection>

                <ChoiceSection>
                    <ChoiceCard good>
                        <h4>選項 A: 購買合法授權 (建議)</h4>
                        <p>以 NT$ {licensePrice} 的優惠價格，立即取得此作品的合法使用授權。付款完成後，此案件將自動結案，保障您的網站正常營運。</p>
                        <ActionButton onClick={() => navigate(`/payment?item=license&price=${licensePrice}&caseId=${uniqueCaseId}`)}>
                            立即支付並取得授權
                        </ActionButton>
                    </ChoiceCard>
                    <ChoiceCard>
                        <h4>選項 B: 面臨法律程序</h4>
                        <p>若您忽視此通知，原創作者將啟動正式 DMCA 下架申訴並保留法律追訴權。基於區塊鏈的強力證據，您可能面臨遠高於授權費的賠償與訴訟成本。</p>
                    </ChoiceCard>
                </ChoiceSection>
            </Container>
        </PageWrapper>
    );
};

export default ResolutionPage;
