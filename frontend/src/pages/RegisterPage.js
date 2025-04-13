// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [userName, setUserName] = useState('');
  const [msg, setMsg] = useState('');

  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  const [shopee, setShopee] = useState('');
  const [ruten, setRuten] = useState('');
  const [amazon, setAmazon] = useState('');
  const [taobao, setTaobao] = useState('');

  const nav = useNavigate();

  const doRegister = async()=>{
    setMsg('');
    if(!email || !password || !userName){
      setMsg('請填寫 Email、密碼、暱稱');
      return;
    }
    if(password !== confirmPw){
      setMsg('兩次密碼不一致！');
      return;
    }

    try {
      // 後端是否已支援這些平台欄位 => 視需求可能放到 /profile/bindPlatforms
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userName', userName);
      formData.append('facebook', facebook);
      formData.append('instagram', instagram);
      formData.append('youtube', youtube);
      formData.append('tiktok', tiktok);
      formData.append('shopee', shopee);
      formData.append('ruten', ruten);
      formData.append('amazon', amazon);
      formData.append('taobao', taobao);

      const resp = await fetch('/auth/register',{
        method:'POST',
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('註冊成功，請去驗證信箱');
        setTimeout(()=> nav('/verify-email'), 1500);
      } else {
        setMsg('註冊失敗: '+ (data.error||''));
      }
    } catch(e){
      setMsg('發生錯誤: '+ e.message);
    }
  };

  // 置中 + 邊框
  const containerStyle = {
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    maxWidth: '500px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)'
  };
  const titleStyle = { color:'red', marginBottom:'1rem', fontSize:'1.5rem' };
  const labelStyle = { display:'block', marginBottom:'0.3rem', color:'#fff', textAlign:'left' };
  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginBottom:'1rem',
    border:'1px solid #aaa',
    borderRadius:'4px'
  };
  const btnStyle = {
    marginTop:'0.5rem',
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
      <h2 style={titleStyle}>Register</h2>

      <div style={{ textAlign:'left' }}>
        <label style={labelStyle}>Email：</label>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />

        <label style={labelStyle}>密碼：</label>
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <label style={labelStyle}>再輸入一次密碼：</label>
        <input
          style={inputStyle}
          type="password"
          value={confirmPw}
          onChange={e=>setConfirmPw(e.target.value)}
        />

        <label style={labelStyle}>暱稱 / UserName：</label>
        <input
          style={inputStyle}
          value={userName}
          onChange={e=>setUserName(e.target.value)}
        />
      </div>

      {/* 社群平台 */}
      <div style={{ textAlign:'left' }}>
        <p style={{ color:'orange', margin:'0.5rem 0 0.2rem' }}>社群平台帳號 (可選填)：</p>

        <label style={labelStyle}>Facebook：</label>
        <input style={inputStyle} value={facebook} onChange={e=>setFacebook(e.target.value)} />

        <label style={labelStyle}>Instagram：</label>
        <input style={inputStyle} value={instagram} onChange={e=>setInstagram(e.target.value)} />

        <label style={labelStyle}>YouTube：</label>
        <input style={inputStyle} value={youtube} onChange={e=>setYoutube(e.target.value)} />

        <label style={labelStyle}>TikTok：</label>
        <input style={inputStyle} value={tiktok} onChange={e=>setTiktok(e.target.value)} />
      </div>

      {/* 電商平台 */}
      <div style={{ textAlign:'left' }}>
        <p style={{ color:'orange', margin:'0.5rem 0 0.2rem' }}>電商平台帳號 (可選填)：</p>

        <label style={labelStyle}>蝦皮 / Shopee：</label>
        <input style={inputStyle} value={shopee} onChange={e=>setShopee(e.target.value)} />

        <label style={labelStyle}>露天 / Ruten：</label>
        <input style={inputStyle} value={ruten} onChange={e=>setRuten(e.target.value)} />

        <label style={labelStyle}>Amazon：</label>
        <input style={inputStyle} value={amazon} onChange={e=>setAmazon(e.target.value)} />

        <label style={labelStyle}>淘寶 / Taobao：</label>
        <input style={inputStyle} value={taobao} onChange={e=>setTaobao(e.target.value)} />
      </div>

      {msg && (
        <p style={{ color:'yellow', margin:'0.5rem 0' }}>{msg}</p>
      )}

      <button onClick={doRegister} style={btnStyle}>送出註冊</button>
    </div>
  );
}
