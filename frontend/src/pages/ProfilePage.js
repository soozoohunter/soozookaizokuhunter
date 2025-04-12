// src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';

export default function ProfilePage(){
  const [igLink, setIgLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [shopeeLink, setShopeeLink] = useState('');
  const [rutenLink, setRutenLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(!token){
      setMsg('尚未登入');
      setLoading(false);
      return;
    }
    fetch('/membership',{ // 從 membership API 取使用者資料
      method:'GET',
      headers:{ 'Authorization': 'Bearer '+token }
    })
    .then(r=>r.json())
    .then(d=>{
      if(d.error){
        setMsg(d.error);
      } else {
        setIgLink(d.igLink||'');
        setYoutubeLink(d.youtubeLink||'');
        setTiktokLink(d.tiktokLink||'');
        setShopeeLink(d.shopeeLink||'');
        setRutenLink(d.rutenLink||'');
      }
      setLoading(false);
    })
    .catch(e=>{
      setMsg('發生錯誤:'+ e.message);
      setLoading(false);
    });
  },[]);

  const doBind = async()=>{
    setMsg('');
    const token = localStorage.getItem('token');
    if(!token){
      setMsg('尚未登入');
      return;
    }
    try {
      const resp = await fetch('/profile/bindPlatforms',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':'Bearer '+token
        },
        body: JSON.stringify({
          igLink, youtubeLink, tiktokLink, shopeeLink, rutenLink
        })
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('更新成功');
      } else {
        setMsg('更新失敗: '+ (data.error||''));
      }
    } catch(e){
      setMsg('發生錯誤:'+ e.message);
    }
  };

  if(loading){
    return <div>載入中...</div>;
  }

  return (
    <div>
      <h2>平台帳號綁定</h2>
      {msg && <p style={{ color:'yellow' }}>{msg}</p>}
      <div style={{ margin:'0.5rem 0' }}>
        <label>IG: </label>
        <input 
          value={igLink}
          onChange={e=>setIgLink(e.target.value)}
          placeholder="https://www.instagram.com/xxx"
          style={{ width:'300px' }}
        />
      </div>
      <div style={{ margin:'0.5rem 0' }}>
        <label>Youtube: </label>
        <input 
          value={youtubeLink}
          onChange={e=>setYoutubeLink(e.target.value)}
          placeholder="https://www.youtube.com/channel/xxx"
          style={{ width:'300px' }}
        />
      </div>
      <div style={{ margin:'0.5rem 0' }}>
        <label>TikTok: </label>
        <input 
          value={tiktokLink}
          onChange={e=>setTiktokLink(e.target.value)}
          placeholder="https://www.tiktok.com/@xxx"
          style={{ width:'300px' }}
        />
      </div>
      <div style={{ margin:'0.5rem 0' }}>
        <label>Shopee: </label>
        <input 
          value={shopeeLink}
          onChange={e=>setShopeeLink(e.target.value)}
          placeholder="https://shopee.tw/xxx"
          style={{ width:'300px' }}
        />
      </div>
      <div style={{ margin:'0.5rem 0' }}>
        <label>Ruten: </label>
        <input 
          value={rutenLink}
          onChange={e=>setRutenLink(e.target.value)}
          placeholder="https://class.ruten.com.tw/user/index00.php?s=xxx"
          style={{ width:'300px' }}
        />
      </div>
      <button onClick={doBind}>更新綁定</button>
    </div>
  );
}
