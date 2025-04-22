// frontend/src/pages/Payment.js

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const item = searchParams.get('item') || 'download_certificate';
  const price = searchParams.get('price') || '99';
  const title = searchParams.get('title') || ''; // 從Step1傳來

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePay = async () => {
    setError('');
    setSuccessMsg('');
    // 檢查token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('尚未登入，請先登入才能付款');
      return;
    }

    try {
      // ★ 這裡呼叫後端 /api/pay 之類的 endpoint
      //   例: const resp = await fetch('/api/pay', ...)
      // 這裡先用假裝成功/失敗:
      const fakeRespOk = false; // DEBUG: 模擬失敗
      if (!fakeRespOk) {
        throw new Error('Request error'); 
      }

      // If success:
      setSuccessMsg('付款成功！感謝您的購買。');
      // 您可 navigate('/payment/success') or do anything
    } catch (err) {
      console.error(err);
      setError(`付款失敗：${err.message}`);
    }
  };

  return (
    <div style={{ color: '#fff', padding: '2rem', textAlign:'center' }}>
      <h2>Step 2: Payment</h2>
      <p>Item: {item}</p>
      <p>Title: {title || '(未命名作品)'}</p>
      <p>Price: NT${price}</p>

      {error && (
        <div style={{ margin:'1rem auto', color: 'red' }}>{error}</div>
      )}
      {successMsg && (
        <div style={{ margin:'1rem auto', color: 'limegreen' }}>{successMsg}</div>
      )}

      <button
        onClick={handlePay}
        style={{
          background:'#ff6f00',
          color:'#fff',
          border:'none',
          borderRadius:'4px',
          padding:'0.75rem 1.5rem',
          cursor:'pointer',
          marginTop:'1rem'
        }}
      >
        Confirm & Pay
      </button>
    </div>
  );
}
