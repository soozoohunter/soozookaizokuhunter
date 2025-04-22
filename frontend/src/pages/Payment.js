// frontend/src/pages/Payment.js

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const item = searchParams.get('item') || 'certificate';
  const price = searchParams.get('price') || '99';

  const [error, setError] = useState('');
  const [showBank, setShowBank] = useState(false);

  // 使用者點擊「Confirm & Pay」後，直接顯示銀行帳號
  const handlePay = () => {
    setError('');
    setShowBank(true);
  };

  return (
    <div style={{ color:'#fff', padding:'2rem', textAlign:'center' }}>
      <h2>Payment</h2>
      <p>Item: {item}</p>
      <p>Price: NT${price}</p>

      {error && (
        <p style={{ color:'red' }}>
          {error}
        </p>
      )}

      {/* 若尚未顯示銀行帳號 => 顯示 Confirm & Pay 按鈕 */}
      {!showBank ? (
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
      ) : (
        // 已點擊 -> 顯示銀行資訊
        <div style={{ marginTop:'2rem', color:'#ff6f00', fontWeight:'bold' }}>
          <p>請匯款至以下帳號：</p>
          <p>
            遠東國際商業銀行 (代號 805)<br/>
            戶名：姚勝德<br/>
            帳號：00200400371797
          </p>
          <p style={{ color:'#fff', marginTop:'1rem', fontSize:'0.9rem' }}>
            匯款後請記下末五碼並聯繫我們 (Email / Phone)，
            <br />
            一經確認即完成購買流程，感謝支持！
          </p>
        </div>
      )}
    </div>
  );
}
