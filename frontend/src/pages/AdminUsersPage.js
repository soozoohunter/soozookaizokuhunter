// frontend/src/pages/AdminUsersPage.jsx (功能完整版)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

function AdminUsersPage() {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) return;
            try {
                // [後端需求] 這裡假設後端有 /api/admin/users 端點，且已用 adminAuth 保護
                const response = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user list. Are you an admin?');
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [token]);

    // [後端需求] 這裡假設後端有 /api/admin/users/:id/plan 端點
    const handlePlanChange = async (userId, newPlanCode) => {
        if (!window.confirm(`確定要將使用者 ${userId} 的方案更改為 ${newPlanCode} 嗎？`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/plan`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planCode: newPlanCode })
            });
            if (!response.ok) throw new Error('Failed to update plan.');
            alert('方案更新成功！');
            // 重新載入使用者列表以顯示最新狀態
            const updatedUsers = users.map(u => u.id === userId ? {...u, subscription: { ...u.subscription, plan: { plan_code: newPlanCode }}} : u);
            setUsers(updatedUsers);
        } catch (err) {
            alert(`方案更新失敗: ${err.message}`);
        }
    };

    if (isLoading) return <div style={styles.container}>Loading users...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

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
                        <tr key={user.id} style={styles.tr}>
                            <td style={styles.td}>{user.id}</td>
                            <td style={styles.td}>{user.email}</td>
                            <td style={styles.td}>{user.role}</td>
                            <td style={styles.td}>{user.subscription?.plan?.plan_code || 'N/A'}</td>
                            <td style={styles.td}>
                                <select 
                                    onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                    defaultValue={user.subscription?.plan?.plan_code || ''}
                                    style={styles.select}
                                >
                                    <option value="" disabled>更改方案</option>
                                    <option value="free_trial">Free Trial</option>
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 專屬樣式
const styles = {
    container: { maxWidth: '1200px', margin: '2rem auto', color: '#E5E7EB' },
    pageTitle: { fontSize: '2rem', color: '#FFFFFF', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#1F2937' },
    th: { padding: '1rem', textAlign: 'left', borderBottom: '2px solid #4B5563', backgroundColor: '#374151', fontWeight: 'bold' },
    tr: { '&:hover': { backgroundColor: '#374151' } },
    td: { padding: '1rem', textAlign: 'left', borderBottom: '1px solid #374151' },
    select: {
        backgroundColor: '#4B5563',
        color: 'white',
        border: '1px solid #6B7280',
        borderRadius: '4px',
        padding: '0.25rem 0.5rem',
    }
};

export default AdminUsersPage;
