import React, { useState } from 'react';

export default function ContactUsPage() {
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState(''); // 職稱
  const [phone, setPhone] = useState('');
  const [requirement, setRequirement] = useState('');

  const handleSubmit = (e)=>{
    e.preventDefault();
    alert(`已收到您的資訊:\n公司: ${companyName}\n職稱: ${title}\n電話: ${phone}\n需求: ${requirement}`);
    // 這裡可呼叫後端 API -> /api/contact
  };

  return (
    <div style={{ maxWidth:'500px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>Contact Us</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        <label style={labelStyle}>
          公司名稱
          <input 
            type="text"
            value={companyName}
            onChange={e=>setCompanyName(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          職稱 / 頭銜
          <input 
            type="text"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          聯絡電話
          <input 
            type="text"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          需求內容
          <textarea
            value={requirement}
            onChange={e=>setRequirement(e.target.value)}
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
