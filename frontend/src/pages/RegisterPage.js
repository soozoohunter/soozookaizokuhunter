import React, { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('COPYRIGHT'); // 預設 COPYRIGHT
  const [platforms, setPlatforms] = useState(''); // 讓使用者輸入 IG/FB
  const [trademarkFile, setTrademarkFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 簡單檢查
    if(!email || !password || !userName || !userRole){
      alert('缺少必填欄位 (email, password, userName, userRole)');
      return;
    }
    if(password !== confirmPwd){
      alert('兩次密碼輸入不一致');
      return;
    }

    try{
      // 用 formData 夾帶檔案 (trademarkLogo) + 其它欄位
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userName', userName);
      formData.append('userRole', userRole);
      formData.append('platforms', platforms);
      // 若 userRole=TRADEMARK or BOTH → 可上傳檔
      if(userRole !== 'COPYRIGHT' && trademarkFile){
        formData.append('trademarkLogo', trademarkFile);
      }

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        alert('註冊成功，請登入！');
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
        <label style={{ marginBottom:'6px' }}>
          Email
          <input 
            type="text" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
            placeholder="請輸入 Email"
            style={inputStyle}
          />
        </label>

        <label style={{ marginBottom:'6px' }}>
          密碼
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)}
            placeholder="請輸入密碼"
            style={inputStyle}
          />
        </label>

        <label style={{ marginBottom:'6px' }}>
          確認密碼
          <input 
            type="password" 
            value={confirmPwd} 
            onChange={e=>setConfirmPwd(e.target.value)}
            placeholder="再次輸入密碼"
            style={inputStyle}
          />
        </label>

        <label style={{ marginBottom:'6px' }}>
          暱稱 (userName)
          <input 
            type="text"
            value={userName}
            onChange={e=>setUserName(e.target.value)}
            placeholder="輸入您的暱稱"
            style={inputStyle}
          />
        </label>

        <label style={{ marginBottom:'6px' }}>
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

        <label style={{ marginBottom:'6px' }}>
          Platforms (用逗號隔開)
          <input 
            type="text"
            value={platforms}
            onChange={e=>setPlatforms(e.target.value)}
            placeholder="例如: instagram,facebook"
            style={inputStyle}
          />
        </label>

        {/* 若 userRole = TRADEMARK or BOTH → 顯示上傳商標圖欄位 */}
        {(userRole === 'TRADEMARK' || userRole === 'BOTH') && (
          <label style={{ marginBottom:'6px' }}>
            上傳商標圖案 (可選)
            <input 
              type="file" 
              onChange={e=>setTrademarkFile(e.target.files[0])}
              style={{ marginTop:'4px' }}
            />
          </label>
        )}

        <button type="submit" style={btnStyle}>送出</button>
      </form>
    </div>
  );
}

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
