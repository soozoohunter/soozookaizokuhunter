// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('COPYRIGHT');

  // 各平台帳號
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');

  // 拍賣平台
  const [shopee, setShopee] = useState('');
  const [ruten, setRuten] = useState('');
  const [ebay, setEbay] = useState('');
  const [amazon, setAmazon] = useState('');

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
      const platformData = {
        instagram,
        facebook,
        tiktok,
        youtube,
        shopee,
        ruten,
        ebay,
        amazon
      };

      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userName', userName);
      formData.append('userRole', userRole);

      formData.append('platforms', JSON.stringify(platformData));

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
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>註冊</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
        
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
          密碼
          <input
            type="password"
            placeholder="請輸入密碼"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

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

        <div style={{ marginBottom:'10px' }}>
          <h3 style={{ margin:'10px 0', color:'#ff1c1c' }}>社群平台帳號</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'10px' }}>
            <tbody>
              <tr>
                <td style={tdStyle}>Instagram</td>
                <td>
                  <input
                    type="text"
                    placeholder="Instagram 帳號"
                    value={instagram}
                    onChange={e=>setInstagram(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>Facebook</td>
                <td>
                  <input
                    type="text"
                    placeholder="Facebook 帳號"
                    value={facebook}
                    onChange={e=>setFacebook(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>TikTok</td>
                <td>
                  <input
                    type="text"
                    placeholder="TikTok 帳號"
                    value={tiktok}
                    onChange={e=>setTiktok(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>YouTube</td>
                <td>
                  <input
                    type="text"
                    placeholder="YouTube 帳號"
                    value={youtube}
                    onChange={e=>setYoutube(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ margin:'10px 0', color:'#ff1c1c' }}>拍賣平台帳號</h3>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              <tr>
                <td style={tdStyle}>蝦皮</td>
                <td>
                  <input
                    type="text"
                    placeholder="蝦皮帳號"
                    value={shopee}
                    onChange={e=>setShopee(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>露天</td>
                <td>
                  <input
                    type="text"
                    placeholder="露天帳號"
                    value={ruten}
                    onChange={e=>setRuten(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>eBay</td>
                <td>
                  <input
                    type="text"
                    placeholder="eBay 帳號"
                    value={ebay}
                    onChange={e=>setEbay(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>Amazon</td>
                <td>
                  <input
                    type="text"
                    placeholder="Amazon 帳號"
                    value={amazon}
                    onChange={e=>setAmazon(e.target.value)}
                    style={inputStyle}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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
const tdStyle = {
  width:'100px',
  color:'#fff',
  paddingRight:'8px'
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
