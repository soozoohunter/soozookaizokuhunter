import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h2`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.dark.text};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const PageSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  margin-bottom: 3rem;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const CardLink = styled(Link)`
  text-decoration: none;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.card};
  padding: 2rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
`;

const CardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.dark.text};
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  line-height: 1.5;
`;

const AdminCard = ({ title, description, linkTo, icon }) => (
    <CardLink to={linkTo}>
        <Card>
            <CardIcon>{icon}</CardIcon>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </Card>
    </CardLink>
);

function AdminDashboardPage() {
    return (
        <PageContainer>
            <PageTitle>Admin Panel</PageTitle>
            <PageSubtitle>選擇一項管理功能以繼續</PageSubtitle>
            <Grid>
                <AdminCard 
                    title="使用者管理"
                    description="檢視、編輯所有使用者的方案、額度與狀態。"
                    linkTo="/admin/users"
                    icon="👥"
                />
                <AdminCard 
                    title="內容管理"
                    description="檢視與管理所有使用者上傳的檔案。(待開發)"
                    linkTo="#"
                    icon="📄"
                />
                <AdminCard 
                    title="系統營運分析"
                    description="查看平台註冊數、收益等統計數據。(待開發)"
                    linkTo="#"
                    icon="📊"
                />
            </Grid>
        </PageContainer>
    );
}

export default AdminDashboardPage;
