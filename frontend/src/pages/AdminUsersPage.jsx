import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.dark.text};
`;

const PageTitle = styled.h2`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.dark.text};
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.dark.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: hidden;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid ${({ theme }) => theme.colors.dark.border};
  background-color: #374151;
  font-weight: bold;
`;

const Td = styled.td`
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
  vertical-align: middle;
`;

const Select = styled.select`
  background-color: #4B5563;
  color: white;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
`;

function AdminUsersPage() {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            setError(err.message || '無法獲取使用者列表。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const handlePlanChange = async (userId, newPlanCode) => {
        if (!newPlanCode) return;
        if (!window.confirm(`確定要將使用者 #${userId} 的方案更改為 ${newPlanCode} 嗎？`)) return;

        try {
            await apiClient.put(`/admin/users/${userId}/subscription`, {
                planCode: newPlanCode
            });
            alert('方案更新成功！');
            fetchUsers();
        } catch (err) {
            alert(`方案更新失敗: ${err.message}`);
        }
    };

    if (isLoading) return <PageContainer>Loading users...</PageContainer>;
    if (error) return <PageContainer><p style={{ color: 'red' }}>Error: {error}</p></PageContainer>;

    return (
        <PageContainer>
            <PageTitle>使用者管理</PageTitle>
            <Table>
                <thead>
                    <tr>
                        <Th>ID</Th>
                        <Th>Email</Th>
                        <Th>角色</Th>
                        <Th>目前方案</Th>
                        <Th>操作</Th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <Td>{user.id}</Td>
                            <Td style={{ wordBreak: 'break-all' }}>{user.email}</Td>
                            <Td>{user.role}</Td>
                            <Td>{user.subscriptions && user.subscriptions.length > 0 ? user.subscriptions[0].plan.plan_code : 'N/A'}</Td>
                            <Td>
                                <Select 
                                    onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>指派方案...</option>
                                    <option value="free_trial">Free Trial</option>
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </Select>
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </PageContainer>
    );
}

export default AdminUsersPage;
