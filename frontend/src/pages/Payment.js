// frontend/src/pages/Payment.js

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const item = searchParams.get('item') || 'unknown';
  const price = searchParams.get('price') || '99';

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePay = async () => {
    setError('');
    setSuccessMsg('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('尚未登入，請先登入才能付款');
      return;
    }

    // 這裡可串接銀行API或第三方金流，如需人工匯款，可直接顯示提示:
    try {
      // ★ 模擬流程：提示使用者「請匯款後提供末五碼」
      //   您也可彈跳視窗或寫進DB
      setSuccessMsg(
        '請匯款至「遠東國際商業銀行 (代號 805)，帳號 00200400371797」， ' +
        '匯款完成後請來信或私訊客服告知末五碼，我們將立即啟用服務。'
      );
      // 若要跳轉成功頁:
      // navigate('/payment/success');
    } catch (err) {
      setError(`付款失敗：${err.message}`);
    }
  };

  return (
    <div style={{ color:'#fff', padding:'2rem', textAlign:'center' }}>
      <h2>Payment</h2>
      <p>Item: {item}</p>
      <p>Price: NT${price}</p>

      {error && <p style={{ color:'red' }}>{error}</p>}
      {successMsg && <p style={{ color:'limegreen', maxWidth:'400px', margin:'1rem auto' }}>{successMsg}</p>}

      <button
        onClick={handlePay}
        style={{
          marginTop:'1rem',
          backgroundColor:'#ff6f00',
          color:'#fff',
          border:'none',
          borderRadius:'4px',
          padding:'0.75rem 1.5rem',
          cursor:'pointer'
        }}
      >
        Confirm & Pay
      </button>
    </div>
  );
}
