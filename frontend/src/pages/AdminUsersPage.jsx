// frontend/src/pages/AdminUsersPage.jsx (最終功能版)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import apiClient from '../services/apiClient';
import styled from 'styled-components';

const styles = {
    container: { maxWidth: '1200px', margin: '2rem auto', color: '#E5E7EB' },
    pageTitle: { fontSize: '2rem', color: '#FFFFFF', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1F2937' },
    th: { padding: '1rem', textAlign: 'left', borderBottom: '2px solid #4B5563', backgroundColor: '#374151', fontWeight: 'bold' },
    td: { padding: '1rem', textAlign: 'left', borderBottom: '1px solid #374151' },
    select: {
        backgroundColor: '#4B5563',
        color: 'white',
        border: '1px solid #6B7280',
        borderRadius: '4px',
        padding: '0.25rem 0.5rem',
        cursor: 'pointer'
    }
};

function AdminUsersPage() {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/admin/users');
            setUsers(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch user list.');
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
            await apiClient.put(`/api/admin/users/${userId}/subscription`, {
                planCode: newPlanCode
            });
            alert('方案更新成功！');
            fetchUsers(); // 重新載入資料以顯示最新狀態
        } catch (err) {
            alert(`方案更新失敗: ${err.response?.data?.error || err.message}`);
        }
    };

    if (isLoading) return <div style={styles.container}>Loading users...</div>;
    if (error) return <div style={styles.container}><p style={{ color: 'red' }}>Error: {error}</p></div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>使用者管理</h2>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>角色</th>
                        <th style={styles.th}>目前方案</th>
                        <th style={styles.th}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td style={styles.td}>{user.id}</td>
                            <td style={{...styles.td, wordBreak: 'break-all'}}>{user.email}</td>
                            <td style={styles.td}>{user.role}</td>
                            <td style={styles.td}>{user.subscriptions && user.subscriptions.length > 0 ? user.subscriptions[0].plan.plan_code : 'N/A'}</td>
                            <td style={styles.td}>
                                <select 
                                    onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                    defaultValue=""
                                    style={styles.select}
                                >
                                    <option value="" disabled>指派方案...</option>
                                    <option value="free_trial">Free Trial</option>
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminUsersPage;
