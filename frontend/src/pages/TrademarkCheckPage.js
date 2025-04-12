// frontend/src/pages/TrademarkCheckPage.js
import React, { useState } from 'react';
import axios from 'axios';

export default function TrademarkCheckPage() {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('pre'); 
  // 'pre' = 申請前檢索, 'post' = 申請後維權檢索

  const handleSearch = async () => {
    if (!keyword) return;
    try {
      setLoading(true);
      setResult(null);
      // 依據不同 searchType 呼叫不同 API
      const apiUrl = searchType === 'pre'
        ? '/api/trademark-check/pre'
        : '/api/trademark-check/post';

      const response = await axios.get(apiUrl, {
        params: { keyword },
      });

      setResult(response.data);
    } catch (error) {
      console.error('Search Error:', error);
      setResult({ error: '查詢失敗，請稍後再試或查看後端日誌。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: '#fff' }}>
      <h1>商標檢索系統</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="radio"
            name="searchType"
            value="pre"
            checked={searchType === 'pre'}
            onChange={(e) => setSearchType(e.target.value)}
          />
          申請前檢索
        </label>

        <label>
          <input
            type="radio"
            name="searchType"
            value="post"
            checked={searchType === 'post'}
            onChange={(e) => setSearchType(e.target.value)}
          />
          申請後維權檢索
        </label>
      </div>

      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="輸入商標關鍵字"
        style={{
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid #ccc',
          marginRight: '1rem',
        }}
      />
      <button 
        onClick={handleSearch}
        style={{
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'orange',
          color: '#000',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {loading ? '查詢中...' : '開始查詢'}
      </button>

      {result && (
        <div style={{ marginTop: '1rem' }}>
          {result.error ? (
            <p style={{ color: 'red' }}>{result.error}</p>
          ) : (
            <pre 
              style={{
                background: '#333',
                padding: '1rem',
                borderRadius: '4px',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
