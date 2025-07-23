// frontend/src/pages/PaymentPage.js
import React, { useState } from 'react';

export default function PaymentPage(){
  const [lastFive, setLastFive] = useState('');
  const [amount, setAmount] = useState('');
  const [planWanted, setPlanWanted] = useState('PRO');
  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('token');
  if(!token){
    return (
      <div style={{color:'#fff', textAlign:'center'}}>
        <h2>尚未登入</h2>
        <p>請先登入後再試</p>
      </div>
    );
  }

  async function submitPaymentInfo(e){
    e.preventDefault();
    if(!lastFive || !amount){
      alert('請填寫後五碼/金額');
      return;
    }
    try {
      const resp = await fetch('/payment/submit',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+token,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ lastFive, amount:parseInt(amount), planWanted })
      });
      const data = await resp.json();
      if(!resp.ok){
        setMsg('提交失敗:' + data.error);
        return;
      }
      setMsg(data.message);
      setLastFive(''); 
      setAmount('');
    } catch(e){
      setMsg('發生錯誤:' + e.message);
    }
  }

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2>提交匯款資訊</h2>
      <form onSubmit={submitPaymentInfo}>
        <div style={{ marginBottom:'1rem' }}>
          <label>匯款帳號後五碼: </label>
          <input 
            type="text"
            value={lastFive}
            onChange={e=>setLastFive(e.target.value)}
          />
        </div>
        <div style={{ marginBottom:'1rem' }}>
          <label>匯款金額: </label>
          <input 
            type="number"
            value={amount}
            onChange={e=>setAmount(e.target.value)}
          />
        </div>
        <div style={{ marginBottom:'1rem' }}>
          <label>欲升級方案: </label>
          <select value={planWanted} onChange={e=>setPlanWanted(e.target.value)}>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
        <button style={btnStyle}>提交</button>
      </form>
      {msg && <p style={{ marginTop:'1rem', color:'yellow' }}>{msg}</p>}
    </div>
  );
}

const btnStyle = {
  backgroundColor:'#ff1c1c',
  color:'#fff',
  border:'none',
  borderRadius:'4px',
  padding:'0.5rem 1rem'
};
