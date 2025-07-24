// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';
import { Link } from 'react-router-dom';

const PageWrapper = styled.div` padding: 2rem; max-width: 1200px; margin: 2rem auto; color: ${({ theme }) => theme.colors.light.text}; `;
const Header = styled.div` margin-bottom: 2rem; `;
const WelcomeTitle = styled.h1` font-size: 2.5rem; margin: 0; `;
const Tabs = styled.div` display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 2rem; `;
const TabButton = styled.button`
  padding: 1rem 1.5rem; font-size: 1rem; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: ${({ active }) => (active ? '#D45398' : '#6b7280')};
  border-bottom: 3px solid ${({ active }) => (active ? '#D45398' : 'transparent')};
  margin-bottom: -1px;
`;
const ContentGrid = styled.div` display: grid; grid-template-columns: 1fr; gap: 2rem; `;
const Card = styled.div` background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; `;
const CardTitle = styled.h2` margin-top: 0; font-size: 1.5rem; `;
const CaseCard = styled(Card)` margin-bottom: 1rem; `;
const CaseInfo = styled.div` display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; `;
const CaseLinkInput = styled.input` width: 100%; border: 1px solid #ccc; padding: 0.5rem; margin-top: 1rem; border-radius: 4px; background: #f9fafb; font-family: monospace; `;
const CopyButton = styled.button` background-color: #A855F7; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; `;
const FileList = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; `;
const FileCard = styled(Link)`
    text-decoration: none; color: inherit; display: block;
    border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
    &:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
`;
const FileThumbnail = styled.div` height: 150px; background: #f3f4f6; display:flex; align-items:center; justify-content:center; font-size: 2rem; `;
const FileInfo = styled.div` padding: 1rem; `;

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('cases'); // 預設顯示案件
    const [dashboardData, setDashboardData] = useState({ files: [], cases: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 一次性獲取所有儀表板需要的資料
                const [casesRes, filesRes] = await Promise.all([
                    apiClient.get('/cases'),
                    apiClient.get('/dashboard/files') // 假設這個 API 返回使用者的檔案列表
                ]);
                setDashboardData({
                    cases: casesRes.data,
                    files: filesRes.data,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('解決連結已複製！');
    };

    if (isLoading) return <PageWrapper><h1>載入中...</h1></PageWrapper>;

    return (
        <PageWrapper>
            <Header>
                <WelcomeTitle>歡迎回來，{user?.realName || user?.email}！</WelcomeTitle>
            </Header>
            <Tabs>
                <TabButton active={activeTab === 'cases'} onClick={() => setActiveTab('cases')}>維權案件管理</TabButton>
                <TabButton active={activeTab === 'works'} onClick={() => setActiveTab('works')}>我的作品庫</TabButton>
                {/* 可以擴展更多 Tab, 例如帳戶設定、批量工具等 */}
            </Tabs>

            <ContentGrid>
                {activeTab === 'cases' && (
                    <Card>
                        <CardTitle>P2P 變現引擎案件列表</CardTitle>
                        {dashboardData.cases.length > 0 ? dashboardData.cases.map(caseItem => (
                            <CaseCard key={caseItem.id}>
                                <CaseInfo>
                                    <div>
                                        <p><strong>侵權網址：</strong><a href={caseItem.infringing_url} target="_blank" rel="noopener noreferrer">{caseItem.infringing_url}</a></p>
                                        <p><strong>對應作品：</strong>{caseItem.File?.filename}</p>
                                        <p><strong>狀態：</strong><span className={`status-${caseItem.status}`}>{caseItem.status}</span></p>
                                        {caseItem.resolution_status === 'license_purchased' && (
                                            <p><strong>P2P收益：</strong>NT$ {caseItem.license_revenue * caseItem.creator_share}</p>
                                        )}
                                    </div>
                                    <CopyButton onClick={() => copyToClipboard(`${window.location.origin}/resolve/${caseItem.unique_case_id}`)}>複製解決連結</CopyButton>
                                </CaseInfo>
                                <CaseLinkInput type="text" readOnly value={`${window.location.origin}/resolve/${caseItem.unique_case_id}`} />
                            </CaseCard>
                        )) : <p>目前沒有進行中的維權案件。前往掃描報告，為您的作品建立維權案件！</p>}
                    </Card>
                )}

                {activeTab === 'works' && (
                    <Card>
                        <CardTitle>我的作品庫</CardTitle>
                        <FileList>
                            {dashboardData.files.length > 0 ? dashboardData.files.map(file => (
                                <FileCard key={file.id} to={`/file/${file.id}`}>
                                    <FileThumbnail>{/* 可顯示縮圖 */}{file.filename.slice(-3)}</FileThumbnail>
                                    <FileInfo>
                                        <p><strong>{file.title}</strong></p>
                                        <p style={{fontSize: '0.8rem', color: '#6b7280'}}>上傳於 {new Date(file.createdAt).toLocaleDateString()}</p>
                                    </FileInfo>
                                </FileCard>
                            )) : <p>您尚未保護任何作品。</p>}
                        </FileList>
                    </Card>
                )}
            </ContentGrid>
        </PageWrapper>
    );
};

export default DashboardPage;
