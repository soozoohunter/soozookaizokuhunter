import React, { useState } from 'react';

export default function ContactUsPage(){
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async(e)=>{
    e.preventDefault();
    // TODO: axios/fetch POST 到 /api/contact-us (若後端未實作請自行實作)
    alert(`感謝聯絡！\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nMsg: ${msg}`);
    setName(''); setCompany(''); setEmail(''); setMsg('');
  };

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>Contact Us</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        <label style={labelStyle}>
          您的大名
          <input
            type="text"
            placeholder="請輸入您的姓名"
            value={name}
            onChange={e=>setName(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          公司/品牌
          <input
            type="text"
            placeholder="(選填) 例如: XXX企業"
            value={company}
            onChange={e=>setCompany(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Email
          <input
            type="text"
            placeholder="請輸入Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          您的需求 / 訊息
          <textarea
            placeholder="想諮詢或需求?..."
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            style={{ ...inputStyle, height:'100px' }}
          />
        </label>
        <button type="submit" style={btnStyle}>送出</button>
      </form>
    </div>
  );
}

const labelStyle = {
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
  backgroundColor:'orange',
  border:'none',
  borderRadius:'4px',
  color:'#fff',
  cursor:'pointer'
};
