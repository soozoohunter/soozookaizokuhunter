import React, { useState, useEffect } from 'react';

export default function ProfilePage(){
  const [userInfo, setUserInfo] = useState(null);
  const [works, setWorks] = useState([]); // 用於顯示已上傳作品 & fingerprint

  useEffect(()=>{
    // 範例: 向後端取得 user 資料 + 作品
    // fetch('/api/user/profile')...
    setUserInfo({
      email:'test@example.com',
      userName:'BOSS',
      userRole:'COPYRIGHT',
      platforms:'{"instagram":"my_ig","facebook":"my_fb"}'
    });
    setWorks([
      { title:'作品1', hash:'abcd1234' },
      { title:'作品2', hash:'efgh5678' }
    ]);
  },[]);

  if(!userInfo) return <div style={{color:'#fff'}}>載入中...</div>;

  // 解析 platforms
  let parsedPlatforms = {};
  try {
    parsedPlatforms = JSON.parse(userInfo.platforms || '{}');
  } catch(e){}

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2>會員中心</h2>
      <div style={{ marginBottom:'1rem' }}>
        <p>Email: {userInfo.email}</p>
        <p>暱稱: {userInfo.userName}</p>
        <p>角色: {userInfo.userRole}</p>
        <h3>平台帳號</h3>
        {
          Object.keys(parsedPlatforms).map(k=>(
            <p key={k}>{k}: {parsedPlatforms[k]}</p>
          ))
        }
      </div>

      <h3>已上傳作品</h3>
      <ul>
        {works.map((w,i)=>(
          <li key={i}>
            {w.title} - Fingerprint: {w.hash}
          </li>
        ))}
      </ul>
    </div>
  );
}
