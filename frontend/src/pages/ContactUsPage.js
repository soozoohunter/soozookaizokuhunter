// frontend/src/pages/ContactUsPage.js
import React, { useState } from 'react';

export default function ContactUsPage(){
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit= async(e)=>{
    e.preventDefault();
    // 這裡只是前端簡易紀錄; 實務上您會 POST 到 /api/contact-us
    setMsg(`已收到您的聯絡資訊:
公司: ${company}
姓名: ${name} / 頭銜: ${title}
電話: ${phone}
需求: ${message}`);
  };

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center' }}>Contact Us</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        <label style={lbStyle}>
          公司名稱
          <input value={company} onChange={e=>setCompany(e.target.value)} style={inputStyle} />
        </label>
        <label style={lbStyle}>
          姓名
          <input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} />
        </label>
        <label style={lbStyle}>
          頭銜 / 職稱
          <input value={title} onChange={e=>setTitle(e.target.value)} style={inputStyle} />
        </label>
        <label style={lbStyle}>
          聯絡電話
          <input value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} />
        </label>
        <label style={lbStyle}>
          需求描述
          <textarea 
            value={message}
            onChange={e=>setMessage(e.target.value)}
            style={{ ...inputStyle, height:'100px' }}
          />
        </label>
        <button type="submit" style={btnStyle}>送出</button>
      </form>
      {msg && <pre style={{ marginTop:'1rem', whiteSpace:'pre-wrap', color:'yellow' }}>{msg}</pre>}
    </div>
  );
}

const lbStyle = {
  marginBottom:'10px'
};
const inputStyle = {
  width:'100%',
  padding:'6px',
  marginTop:'4px',
  borderRadius:'4px',
  border:'1px solid #666'
};
const btnStyle = {
  marginTop:'12px',
  padding:'10px',
  backgroundColor:'#ff1c1c',
  border:'none',
  borderRadius:'4px',
  color:'#fff',
  cursor:'pointer'
};
