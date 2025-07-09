// frontend/src/pages/ContactPage.js
import React, { useState } from 'react';

export default function ContactUsPage() {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  // 送出表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResultMsg('');

    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          jobTitle,
          contactName,
          phone,
          address,
          message
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setResultMsg('感謝您的聯絡，我們已收到表單！');
        // 清空欄位
        setCompanyName('');
        setJobTitle('');
        setContactName('');
        setPhone('');
        setAddress('');
        setMessage('');
      } else {
        setResultMsg(`送出失敗：${data.error || '未知錯誤'}`);
      }
    } catch (err) {
      setResultMsg('發生錯誤：' + err.message);
    }
  };

  // 讓頁面與表單置中 + 橘色邊框
  const containerStyle = {
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    maxWidth: '480px',
    textAlign: 'left',
    background: 'rgba(255,255,255,0.05)'
  };

  const titleStyle = {
    textAlign: 'center',
    color: 'red',
    marginBottom: '1rem',
    fontSize: '1.5rem'
  };

  const labelStyle = { display: 'block', margin: '0.5rem 0 0.2rem', color:'#fff' };
  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #aaa'
  };
  const textareaStyle = {
    width: '100%',
    height: '80px',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #aaa'
  };
  const btnStyle = {
    marginTop:'1rem',
    padding:'0.5rem 1.2rem',
    border:'2px solid orange',
    background:'black',
    color:'orange',
    cursor:'pointer',
    borderRadius:'4px',
    fontWeight:'bold'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Contact Us</h2>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>公司名稱 / Company Name</label>
        <input
          style={inputStyle}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <label style={labelStyle}>頭銜 / Job Title</label>
        <input
          style={inputStyle}
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />

        <label style={labelStyle}>聯絡人姓名 / Contact Name</label>
        <input
          style={inputStyle}
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />

        <label style={labelStyle}>聯絡電話 / Phone</label>
        <input
          style={inputStyle}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label style={labelStyle}>地址 / Address</label>
        <input
          style={inputStyle}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <label style={labelStyle}>需求 / Message</label>
        <textarea
          style={textareaStyle}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit" style={btnStyle}>送出</button>
      </form>

      {resultMsg && (
        <p style={{ marginTop:'1rem', color:'orange', fontWeight:'bold' }}>{resultMsg}</p>
      )}
    </div>
  );
}
