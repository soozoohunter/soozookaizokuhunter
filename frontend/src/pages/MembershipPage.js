// src/pages/MembershipPage.js
import React, { useEffect, useState } from 'react';

export default function MembershipPage(){
  const [info, setInfo] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(()=>{
    fetch('/membership',{
      method:'GET',
      headers:{
        'Authorization':'Bearer '+localStorage.getItem('token')
      }
    })
    .then(r=>r.json())
    .then(d=>setInfo(d))
    .catch(e=>console.error(e));
  },[]);

  const upgradePlan= async()=>{
    setUpgrading(true);
    try {
      const resp = await fetch('/membership/upgrade',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+localStorage.getItem('token')
        }
      });
      const data = await resp.json();
      if(resp.ok){
        alert('升級成功 => '+ data.plan);
        setInfo({...info, plan:data.plan});
      } else {
        alert('升級失敗:' + data.error);
      }
    } catch(e){
      alert('發生錯誤:'+e.message);
    } finally {
      setUpgrading(false);
    }
  };

  if(!info){
    return <div>載入中...</div>;
  }

  if(info.error){
    return <div>錯誤: {info.error}</div>;
  }

  return (
    <div>
      <h2>會員中心</h2>
      <p>Email: {info.email}</p>
      <p>暱稱: {info.userName}</p>
      <p>角色: {info.userRole}</p>
      <p>目前方案: {info.plan}</p>
      <p>已上傳影片次數: {info.uploadVideos}</p>
      <p>已上傳圖片次數: {info.uploadImages}</p>
      {info.plan==='BASIC' && (
        <button onClick={upgradePlan} disabled={upgrading}>
          升級到 PRO
        </button>
      )}
    </div>
  );
}
