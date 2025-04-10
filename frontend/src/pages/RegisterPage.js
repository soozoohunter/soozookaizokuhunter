import React, { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('COPYRIGHT');
  const [platforms, setPlatforms] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault();
    if(!email || !password || !userName || !userRole){
      alert('缺少必填欄位 (email, password, userName, userRole)');
      return;
    }
    if(password !== confirmPwd){
      alert('兩次密碼不一致');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userName', userName);
      formData.append('userRole', userRole);
      formData.append('platforms', platforms);

      const resp = await fetch('/api/auth/register', {
        method:'POST',
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        alert('註冊成功，請前往登入！');
        window.location.href = '/login';
      } else {
        alert(data.error || '註冊失敗');
      }
    } catch(err){
      alert('發生錯誤：' + err.message);
    }
  };

  return (
    <div style={{ maxWidth:'500px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>註冊</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        
        {/* Email */}
        <label style={labelStyle}>
          Email
          <input
            type="text"
            placeholder="請輸入您的 Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* 密碼 */}
        <label style={labelStyle}>
          密碼
          <input
            type="password"
            placeholder="請輸入密碼"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* 確認密碼 */}
        <label style={labelStyle}>
          確認密碼
          <input
            type="password"
            placeholder="再輸入一次密碼"
            value={confirmPwd}
            onChange={e=>setConfirmPwd(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* userName 暱稱 */}
        <label style={labelStyle}>
          暱稱 (userName)
          <input
            type="text"
            placeholder="請輸入暱稱"
            value={userName}
            onChange={e=>setUserName(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* userRole */}
        <label style={labelStyle}>
          角色 (userRole)
          <select
            value={userRole}
            onChange={e=>setUserRole(e.target.value)}
            style={{ ...inputStyle, background:'#000', color:'#fff' }}
          >
            <option value="COPYRIGHT">COPYRIGHT (著作權)</option>
            <option value="TRADEMARK">TRADEMARK (商標權)</option>
            <option value="BOTH">BOTH (皆有)</option>
          </select>
        </label>

        {/* platforms */}
        <label style={labelStyle}>
          平台列表 (如 instagram,facebook)
          <input
            type="text"
            placeholder="可輸入多個，用逗號分隔"
            value={platforms}
            onChange={e=>setPlatforms(e.target.value)}
            style={inputStyle}
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
  padding:'8px',
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
