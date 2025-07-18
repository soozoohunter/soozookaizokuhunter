// frontend/src/pages/Upload.jsx (已修正)
import React, { useState } from 'react';
// 【核心修正】: 引入我們新建的 apiRequest 函式
import { apiRequest } from '../apiClient'; 

export default function Upload() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 檢查是否已登入的邏輯保持不變
    const token = localStorage.getItem('token');
    if (!token) {
        return (
            <div style={{ textAlign: 'center', color: '#fff', marginTop: '2rem' }}>
                <h2>尚未登入</h2>
                <p>請先登入後再使用上傳功能</p>
            </div>
        );
    }

    const doUpload = async () => {
        const backendRoute = '/api/protect/step1';

        if (!file) {
            alert('請選擇一個檔案');
            return;
        }

        setIsLoading(true);
        setMsg('上傳中，正在為您的作品生成數位指紋與證明書...');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // 將所有 step1 需要的表單欄位一起打包
            formData.append('realName', '測試者');
            formData.append('birthDate', '2000-01-01');
            formData.append('phone', '0912345678');
            formData.append('address', '測試地址');
            formData.append('email', 'test@example.com');
            formData.append('title', title || '我的原創作品');
            formData.append('agreePolicy', 'true');

            // 【核心修正】: 使用 apiRequest 函式來發送請求
            // 它會自動處理 URL 和 token，確保發出的請求是合法的
            const data = await apiRequest(backendRoute, {
                method: 'POST',
                body: formData,
            });

            setMsg(`上傳成功！檔案 ID: ${data.fileId} | 指紋: ${data.fingerprint || '(無)'} | PDF 證明書: ${data.pdfUrl}`);

        } catch (err) {
            console.error(err);
            setMsg(`上傳錯誤：${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ margin: '2rem', maxWidth: '600px', color: '#fff' }}>
            <h2>第一步：上傳原創作品</h2>
            <p>請上傳您的圖片或短影音，系統將為您生成數位指紋與原創證明書。</p>
            
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>作品標題: </label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: '8px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="例如：2025 台北夜景"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                 <label style={{ display: 'block', marginBottom: '5px' }}>選擇檔案: </label>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ color: '#fff' }}
                />
            </div>

            <button onClick={doUpload} style={btnStyle} disabled={isLoading}>
                {isLoading ? '處理中...' : '上傳並生成證明'}
            </button>

            {msg && (
                <p
                    style={{
                        marginTop: '1rem',
                        color: msg.includes('錯誤') ? '#ff4d4d' : '#23d160',
                        backgroundColor: '#333',
                        padding: '10px',
                        borderRadius: '4px',
                    }}
                >
                    {msg}
                </p>
            )}
        </div>
    );
}

const btnStyle = {
    backgroundColor: '#ff1c1c',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: 1,
};
