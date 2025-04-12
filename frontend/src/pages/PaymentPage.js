// frontend/src/pages/PaymentPage.js
import React, { useState } from 'react';

export default function PaymentPage() {
  const [msg, setMsg] = useState('');

  // ... 這裡寫匯款資訊、後台管理人審核的流程 ...
  // 例如:
  // const [lastFive, setLastFive] = useState('');
  // const [amount, setAmount] = useState('');
  // const [planWanted, setPlanWanted] = useState('PRO');
  // ...

  return (
    <div style={{ color: '#fff' }}>
      <h2>Payment Page</h2>
      <p>這裡放你的匯款提交表單</p>
    </div>
  );
}
