import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const item = params.get('item') || 'download_certificate';
  const price = params.get('price') || '99';

  const handlePay = async () => {
    try {
      const payload = { item, price: Number(price) };
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("Request error");
      const data = await res.json();
      if(!data.success) throw new Error(data.error || "Payment failed");
      navigate('/payment/success');
    } catch(e) {
      alert("付款失敗: " + e.message);
    }
  };

  return (
    <div style={{ color:'#fff', textAlign:'center', padding:'2rem' }}>
      <h2>Step 2: Payment</h2>
      <p>Item: {item}</p>
      <p>Price: NT${price}</p>
      <button
        onClick={handlePay}
        style={{
          background:'#ff6f00',
          color:'#fff',
          border:'none',
          borderRadius:'4px',
          padding:'0.6rem 1.2rem'
        }}
      >
        Confirm & Pay
      </button>
    </div>
  );
}
