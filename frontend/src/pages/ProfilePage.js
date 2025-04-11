// frontend/src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';

export default function ProfilePage(){
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(!token){
      setMsg('尚未登入');
      return;
    }
    fetch('/membership',{
      method:'GET',
      headers:{
        'Authorization':'Bearer '+ token
      }
    })
    .then(r=>r.json())
    .then(d=>{
      setInfo(d);
    })
    .catch(e=>{
      setMsg('發生錯誤:'+ e.message);
    });
  },[]);

  const doUpgrade= async()=>{
    try {
      const resp = await fetch('/membership/upgrade',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+ localStorage.getItem('token')
        }
      });
      const data = await resp.json();
      if(resp.ok){
        alert('升級成功 => '+ data.plan);
        setInfo({...info, plan:data.plan});
      } else {
        alert('升級失敗:'+ (data.error||'未知錯誤'));
      }
    } catch(e){
      alert('發生錯誤:'+ e.message);
    }
  };

  if(msg){
    return <div style={{ color:'#fff' }}>{msg}</div>;
  }
  if(!info){
    return <div style={{ color:'#fff' }}>載入中...</div>;
  }
  if(info.error){
    return <div style={{ color:'#fff' }}>錯誤: {info.error}</div>;
  }

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2>會員中心</h2>
      <p>Email: {info.email}</p>
      <p>暱稱: {info.userName}</p>
      <p>角色: {info.userRole}</p>
      <p>目前方案: {info.plan}</p>

      <p>已上傳影片次數: {info.uploadVideos}</p>
      <p>已上傳圖片次數: {info.uploadImages}</p>

      {/* 如果是 BASIC，可以升級 */}
      {info.plan === 'BASIC' && (
        <button 
          onClick={doUpgrade}
          style={{
            marginTop:'12px',
            padding:'10px',
            backgroundColor:'orange',
            border:'none',
            borderRadius:'4px',
            color:'#fff',
            cursor:'pointer'
          }}
        >
          升級到 PRO
        </button>
      )}
    </div>
  );
}
