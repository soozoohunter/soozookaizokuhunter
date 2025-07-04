// frontend/src/pages/AdminDashboardPage.jsx (重構為導覽中樞)
import React from 'react';
import { Link } from 'react-router-dom';

const AdminCard = ({ title, description, linkTo, icon }) => (
    <Link to={linkTo} style={styles.cardLink}>
        <div style={styles.card}>
            <div style={styles.cardIcon}>{icon}</div>
            <h3 style={styles.cardTitle}>{title}</h3>
            <p style={styles.cardDescription}>{description}</p>
        </div>
    </Link>
);

function AdminDashboardPage() {
    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.pageTitle}>Admin Panel</h2>
            <p style={styles.pageSubtitle}>選擇一項管理功能以繼續</p>
            <div style={styles.grid}>
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
            </div>
        </div>
    );
}

// 專屬樣式
const styles = {
    pageContainer: { maxWidth: '1200px', margin: '2rem auto' },
    pageTitle: { fontSize: '2.5rem', color: '#FFFFFF', marginBottom: '0.5rem', textAlign: 'center' },
    pageSubtitle: { fontSize: '1.2rem', color: '#9CA3AF', marginBottom: '3rem', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' },
    cardLink: { textDecoration: 'none' },
    card: {
        backgroundColor: '#1F2937',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #374151',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    cardIcon: { fontSize: '3rem', marginBottom: '1rem' },
    cardTitle: { margin: '0 0 0.75rem 0', fontSize: '1.5rem', color: '#F3F4F6' },
    cardDescription: { margin: 0, fontSize: '1rem', color: '#9CA3AF', lineHeight: '1.5' }
};

export default AdminDashboardPage;
