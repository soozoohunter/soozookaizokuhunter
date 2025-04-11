import React, { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(()=>{
    // 範例：抓取後端 /api/user/profile (若您後端尚未實作，可自行實作)
    // 這裡僅示範: 假裝拿到 user = { email, userName, userRole, platforms {...}, ... }
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if(!token) return;
        const resp = await fetch('/api/user/profile', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if(resp.ok){
          const data = await resp.json();
          setUserInfo(data);
        } else {
          console.log('無法取得會員資料');
        }
      } catch(e){
        console.log(e);
      }
    }
    fetchProfile();
  },[]);

  // 如果後端未實作 /api/user/profile，可先 mock
  // const userInfo = {
  //   email: 'test@example.com',
  //   userName: 'BOSS',
  //   userRole: 'COPYRIGHT',
  //   platforms: {
  //     instagram: 'my_ig',
  //     facebook: 'my_fb'
  //   },
  //   uploadedWorks: [
  //     { title:'作品1', fingerprint:'abcd1234' },
  //     { title:'作品2', fingerprint:'efgh5678' }
  //   ]
  // };

  return (
    <div style={{ maxWidth:'600px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>會員中心</h2>
      {!userInfo && (
        <p>載入中或尚未登入</p>
      )}
      {userInfo && (
        <>
          <p>Email: {userInfo.email}</p>
          <p>暱稱: {userInfo.userName}</p>
          <p>角色: {userInfo.userRole}</p>

          <h3>平台帳號</h3>
          { userInfo.platforms && (
            <ul>
              {Object.entries(userInfo.platforms).map(([k,v])=>(
                <li key={k}>{k}: {v}</li>
              ))}
            </ul>
          )}

          <h3>已上傳作品</h3>
          { userInfo.uploadedWorks && (
            <ul>
              {userInfo.uploadedWorks.map((w,i)=>(
                <li key={i}>作品 {i+1} - Fingerprint: {w.fingerprint}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
