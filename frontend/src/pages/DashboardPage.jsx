import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';

const DashboardWrapper = styled.div`
  color: ${({ theme }) => theme.colors.dark.text};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.dark.text};
  margin: 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  margin-top: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.main};
`;

const CardTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.dark.accent};
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FileItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const FileName = styled.span`
  word-break: break-all;
`;

const ViewLink = styled(Link)`
  color: ${({ theme }) => theme.colors.dark.primary};
  font-weight: bold;
  &:hover {
    text-decoration: underline;
  }
`;

function DashboardPage() {
    const { user } = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await apiClient.get('/files');
                setFiles(response.data);
            } catch (err) {
                setError('無法獲取檔案列表。');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFiles();
    }, []);

    return (
        <DashboardWrapper>
            <Header>
                <WelcomeTitle>歡迎回來, {user?.email || '創作者'}！</WelcomeTitle>
                <WelcomeSubtitle>在這裡管理您的數位資產與侵權報告。</WelcomeSubtitle>
            </Header>
            <Grid>
                <Card>
                    <CardTitle>最近保護的檔案</CardTitle>
                    {isLoading && <p>載入中...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {!isLoading && !error && (
                        <FileList>
                            {files.length > 0 ? files.slice(0, 5).map(file => (
                                <FileItem key={file.id}>
                                    <FileName>{file.filename}</FileName>
                                    <ViewLink to={`/file/${file.id}`}>查看詳情</ViewLink>
                                </FileItem>
                            )) : <p>您尚未保護任何檔案。</p>}
                        </FileList>
                    )}
                </Card>
            </Grid>
        </DashboardWrapper>
    );
}

export default DashboardPage;
