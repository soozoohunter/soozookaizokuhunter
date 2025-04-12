// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [userName, setUserName] = useState('');

  // 社群平台
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  // 電商平台
  const [shopee, setShopee] = useState('');
  const [ruten, setRuten] = useState('');
  const [amazon, setAmazon] = useState('');
  const [taobao, setTaobao] = useState('');

  // 驗證碼
  const [verifyCode, setVerifyCode] = useState('');

  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  const doRegister = async() => {
    setMsg('');

    if(!email || !password || !confirmPwd || !userName){
      setMsg('請輸入必填欄位(Email/密碼/確認密碼/暱稱)');
      return;
    }
    if(password !== confirmPwd){
      setMsg('密碼與確認密碼不一致');
      return;
    }

    try {
      // 建立要送到後端的 formData
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
      formData.append('verifyCode', verifyCode);

      const resp = await fetch('/auth/register',{
        method:'POST',
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('註冊成功，請至信箱查看驗證碼後前往 [驗證頁] 輸入');
        // 可以自動跳轉或要求使用者自行前往
        setTimeout(()=>{
          nav('/verify-email');
        }, 1500);
      } else {
        setMsg('註冊失敗: '+ data.error);
      }
    } catch(e){
      setMsg('發生錯誤: '+ e.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>

        <h2 style={styles.title}>註冊</h2>

        {/* Email */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email: </label>
          <input 
            type="email"
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            style={styles.input}
          />
        </div>

        {/* Password */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>密碼: </label>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Confirm Password */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>確認密碼: </label>
          <input 
            type="password" 
            value={confirmPwd} 
            onChange={e=>setConfirmPwd(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Nickname */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>暱稱: </label>
          <input 
            value={userName} 
            onChange={e=>setUserName(e.target.value)} 
            style={styles.input}
          />
        </div>

        {/* 驗證碼 (若後端需要在註冊同時給使用者輸入) */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>驗證碼: </label>
          <input 
            value={verifyCode}
            onChange={e=>setVerifyCode(e.target.value)}
            style={styles.input}
          />
        </div>

        <hr style={{ margin:'1rem 0', border:'1px solid orange' }}/>

        {/* 社群平台 (Facebook / Instagram / YouTube / TikTok) */}
        <h3 style={styles.subTitle}>社群平台帳號 (選填)</h3>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Facebook: </label>
          <input 
            value={facebook}
            onChange={e=>setFacebook(e.target.value)}
            style={styles.input}
            placeholder="https://www.facebook.com/xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Instagram: </label>
          <input 
            value={instagram}
            onChange={e=>setInstagram(e.target.value)}
            style={styles.input}
            placeholder="https://www.instagram.com/xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>YouTube: </label>
          <input 
            value={youtube}
            onChange={e=>setYoutube(e.target.value)}
            style={styles.input}
            placeholder="https://www.youtube.com/channel/xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>TikTok: </label>
          <input 
            value={tiktok}
            onChange={e=>setTiktok(e.target.value)}
            style={styles.input}
            placeholder="https://www.tiktok.com/@xxx"
          />
        </div>

        <hr style={{ margin:'1rem 0', border:'1px solid orange' }}/>

        {/* 電商平台 (Shopee / 露天 / Amazon / 淘寶...) */}
        <h3 style={styles.subTitle}>電商平台帳號 (選填)</h3>
        <div style={styles.inputGroup}>
          <label style={styles.label}>蝦皮: </label>
          <input 
            value={shopee}
            onChange={e=>setShopee(e.target.value)}
            style={styles.input}
            placeholder="https://shopee.tw/xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>露天拍賣: </label>
          <input 
            value={ruten}
            onChange={e=>setRuten(e.target.value)}
            style={styles.input}
            placeholder="https://class.ruten.com.tw/user/index00.php?s=xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Amazon: </label>
          <input 
            value={amazon}
            onChange={e=>setAmazon(e.target.value)}
            style={styles.input}
            placeholder="https://www.amazon.com/sp?seller=xxx"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>淘寶: </label>
          <input 
            value={taobao}
            onChange={e=>setTaobao(e.target.value)}
            style={styles.input}
            placeholder="https://xxx.taobao.com"
          />
        </div>

        {/* 提交按鈕 */}
        <button onClick={doRegister} style={styles.submitBtn}>送出註冊</button>

        {/* 訊息顯示 */}
        {msg && <p style={styles.msg}>{msg}</p>}
      </div>
    </div>
  );
}

// 置中 + 橘色邊框的樣式
const styles = {
  container: {
    backgroundColor: '#000',
    minHeight: '100vh',
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
  },
  formWrapper: {
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90%',
    color: '#fff'
  },
  title: {
    margin: 0,
    marginBottom: '1rem',
    color: 'orange'
  },
  subTitle: {
    margin: 0,
    marginBottom: '0.5rem',
    color: '#ff7700',
    fontSize: '1.1rem'
  },
  inputGroup: {
    marginBottom: '0.75rem'
  },
  label: {
    display:'inline-block',
    width:'90px',
    textAlign:'right',
    marginRight:'0.5rem'
  },
  input: {
    width:'200px',
    padding:'0.25rem',
    borderRadius:'4px',
    border:'1px solid #666',
    background:'#222',
    color:'#fff'
  },
  submitBtn: {
    background:'orange',
    border:'none',
    padding:'0.5rem 1rem',
    borderRadius:'4px',
    color:'#fff',
    fontWeight:'bold',
    cursor:'pointer',
    marginTop:'1rem'
  },
  msg: {
    marginTop:'1rem',
    color:'yellow'
  }
};
