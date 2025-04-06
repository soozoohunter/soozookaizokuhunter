import React, { useState } from 'react';

function App() {
  const [view, setView] = useState('login');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(null);
  const [uploadRes, setUploadRes] = useState(null);

  const handleRegister = async(e)=>{
    e.preventDefault();
    const {username, password} = e.target;
    try{
      let resp = await fetch('/api/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:username.value, password:password.value})
      });
      let data = await resp.json();
      if(resp.ok){
        setMessage('註冊成功，去登入');
        setView('login');
      } else {
        setMessage(data.error||'註冊失敗');
      }
    } catch(err){
      setMessage('錯誤:'+err.message);
    }
  };

  const handleLogin = async(e)=>{
    e.preventDefault();
    const {username, password} = e.target;
    try{
      let resp = await fetch('/api/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:username.value, password:password.value})
      });
      let data=await resp.json();
      if(resp.ok){
        setMessage('登入成功');
        setToken(data.token);
        setView('upload');
      }else{
        setMessage(data.error||'登入失敗');
      }
    }catch(err){
      setMessage('錯誤:'+err.message);
    }
  };

  const handleUpload = async(e)=>{
    e.preventDefault();
    if(!token){ 
      setMessage('尚未登入');
      return;
    }
    const file = e.target.file.files[0];
    if(!file){
      setMessage('請選擇檔案');
      return;
    }
    const formData=new FormData();
    formData.append('file', file);
    try{
      let resp=await fetch('/api/upload',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+token
        },
        body: formData
      });
      let data=await resp.json();
      if(resp.ok){
        setMessage('上傳成功');
        setUploadRes(data);
      }else{
        setMessage(data.error||'上傳失敗');
      }
    }catch(err){
      setMessage('錯誤:'+err.message);
    }
  };

  return (
    <div style={{padding:'1em',maxWidth:'600px',margin:'auto'}}>
      <h1>版權保護系統 (React)</h1>
      {view==='register' && (
        <form onSubmit={handleRegister}>
          <h2>註冊</h2>
          <label>帳號<input name="username"/></label>
          <label>密碼<input type="password" name="password"/></label>
          <button>註冊</button>
          <p><a onClick={()=>{setMessage(''); setView('login')}}>已有帳號? 去登入</a></p>
        </form>
      )}
      {view==='login' && (
        <form onSubmit={handleLogin}>
          <h2>登入</h2>
          <label>帳號<input name="username"/></label>
          <label>密碼<input type="password" name="password"/></label>
          <button>登入</button>
          <p><a onClick={()=>{setMessage(''); setView('register')}}>沒有帳號? 去註冊</a></p>
        </form>
      )}
      {view==='upload' && (
        <div>
          <h2>上傳檔案</h2>
          <form onSubmit={handleUpload}>
            <input type="file" name="file"/>
            <button>上傳</button>
          </form>
          {uploadRes && (
            <div style={{border:'1px solid #ccc',padding:'1em',marginTop:'1em'}}>
              <p>檔案URL: <a href={uploadRes.fileUrl} target="_blank" rel="noreferrer">{uploadRes.fileUrl}</a></p>
              <p>指紋: {uploadRes.fingerprint}</p>
              <p>IPFS: {uploadRes.ipfsHash}</p>
              <p>交易: {uploadRes.blockchainTx}</p>
            </div>
          )}
        </div>
      )}
      {message && <p style={{color:'red'}}>{message}</p>}
    </div>
  );
}

export default App;
