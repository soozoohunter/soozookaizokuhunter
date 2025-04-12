// frontend/src/pages/ContactUsPage.js
import React, { useState } from 'react';

export default function ContactUsPage(){
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState(''); // 職稱
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [responseMsg, setResponseMsg] = useState('');

  // 提交聯絡表單
  const handleSubmit = async(e)=>{
    e.preventDefault();
    setResponseMsg('');

    // 檢查必填
    if(!contactName || !email || !message){
      setResponseMsg('請至少填寫 [聯絡人姓名]、[Email]、[需求/訊息]');
      return;
    }

    try {
      const resp = await fetch('/api/contact',{
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          companyName,
          title,
          contactName,
          phone,
          email,
          message
        })
      });
      const data = await resp.json();

      if(resp.ok){
        // 成功
        setResponseMsg('您的訊息已送出，我們將儘快與您聯繫。');
        // 清空
        setCompanyName('');
        setTitle('');
        setContactName('');
        setPhone('');
        setEmail('');
        setMessage('');
      } else {
        setResponseMsg('送出失敗: ' + (data.error||'不明原因'));
      }
    } catch(err){
      setResponseMsg('發生錯誤: ' + err.message);
    }
  };

  // 置中、橘色邊框的樣式
  const containerStyle = {
    maxWidth: '500px',
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#111',
    color: '#fff',
    fontFamily: 'sans-serif'
  };

  const labelStyle = { display:'block', marginBottom:'0.3rem' };
  const inputStyle = {
    width:'100%',
    padding:'0.5rem',
    marginBottom:'1rem',
    border:'1px solid #555',
    borderRadius:'4px',
    background:'#222',
    color:'#fff'
  };
  const textareaStyle = {
    width:'100%',
    height:'100px',
    padding:'0.5rem',
    marginBottom:'1rem',
    border:'1px solid #555',
    borderRadius:'4px',
    background:'#222',
    color:'#fff'
  };
  const buttonStyle = {
    background:'orange',
    color:'#000',
    border:'none',
    borderRadius:'4px',
    padding:'0.5rem 1rem',
    cursor:'pointer',
    fontWeight:'bold'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign:'center', color:'red', marginBottom:'1rem' }}>
        Contact Us
      </h2>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>公司名稱 (Company Name):</label>
        <input 
          type="text"
          style={inputStyle}
          value={companyName}
          onChange={e=>setCompanyName(e.target.value)}
        />

        <label style={labelStyle}>職稱 (Title):</label>
        <input 
          type="text"
          style={inputStyle}
          value={title}
          onChange={e=>setTitle(e.target.value)}
        />

        <label style={labelStyle}>聯絡人姓名 (Contact Name)*:</label>
        <input 
          type="text"
          style={inputStyle}
          value={contactName}
          onChange={e=>setContactName(e.target.value)}
          required
        />

        <label style={labelStyle}>電話 (Phone):</label>
        <input 
          type="text"
          style={inputStyle}
          value={phone}
          onChange={e=>setPhone(e.target.value)}
        />

        <label style={labelStyle}>Email*:</label>
        <input 
          type="email"
          style={inputStyle}
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />

        <label style={labelStyle}>需求 / 訊息 (Message)*:</label>
        <textarea 
          style={textareaStyle}
          value={message}
          onChange={e=>setMessage(e.target.value)}
          required
        />

        <div style={{ textAlign:'center', marginTop:'1rem' }}>
          <button type="submit" style={buttonStyle}>送出聯絡</button>
        </div>
      </form>

      {responseMsg && (
        <p style={{ color:'yellow', marginTop:'1rem', textAlign:'center' }}>
          {responseMsg}
        </p>
      )}
    </div>
  );
}
