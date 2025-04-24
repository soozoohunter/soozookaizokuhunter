// frontend/src/pages/MembershipPage.js
import React, { useEffect, useState } from 'react';

export default function MembershipPage() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('尚未登入');
      setLoading(false);
      return;
    }
    fetch('/membership', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        setInfo(d);
        setLoading(false);
      })
      .catch((e) => {
        setMsg('發生錯誤:' + e.message);
        setLoading(false);
      });
  }, []);

  const doUpgrade = async (targetPlan) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/membership/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ targetPlan }),
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message);
        // 更新 info
        setInfo((prev) => ({
          ...prev,
          plan: data.plan,
        }));
      } else {
        alert('升級失敗: ' + data.error);
      }
    } catch (e) {
      alert('發生錯誤:' + e.message);
    }
  };

  if (loading) {
    return <div>載入中...</div>;
  }
  if (msg) {
    return <div style={{ color: 'red' }}>{msg}</div>;
  }
  if (info.error) {
    return <div style={{ color: 'red' }}>錯誤: {info.error}</div>;
  }

  return (
    <div style={{ color: '#fff', margin: '2rem' }}>
      <h2>會員中心</h2>
      <p>Email: {info.email}</p>
      <p>用戶名: {info.userName}</p>
      <p>目前方案: {info.plan}</p>
      <p>已上傳影片次數: {info.uploadVideos}</p>
      <p>已上傳圖片次數: {info.uploadImages}</p>
      {/* 其他資訊... */}
      <hr />
      <h3>方案升級</h3>
      {info.plan === 'BASIC' && (
        <>
          <button onClick={() => doUpgrade('PRO')} style={{ marginRight: '1rem' }}>
            升級至 PRO
          </button>
          <button onClick={() => doUpgrade('ENTERPRISE')}>升級至 ENTERPRISE</button>
        </>
      )}
      {info.plan === 'PRO' && (
        <button onClick={() => doUpgrade('ENTERPRISE')}>
          升級至 ENTERPRISE
        </button>
      )}
      {info.plan === 'ENTERPRISE' && <p>您已是最高階方案</p>}
    </div>
  );
}
