// frontend/src/pages/PlatformAccounts.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PlatformAccounts({ token }) {
  const [list, setList] = useState([]);
  const [platformName, setPlatformName] = useState('');
  const [accountId, setAccountId] = useState('');

  // 取得平台帳號清單
  const fetchList = async () => {
    try {
      const res = await axios.get('/api/platform/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 新增平台帳號
  const addPlatform = async () => {
    try {
      await axios.post('/api/platform/add', {
        platformName,
        accountId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlatformName('');
      setAccountId('');
      fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // 第一次進入頁面時就抓清單
    fetchList();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>我的平台帳號</h2>
      <div>
        <input
          placeholder="平台名稱(例: youtube, tiktok)"
          value={platformName}
          onChange={e => setPlatformName(e.target.value)}
        />
        <input
          placeholder="帳號ID"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
        />
        <button onClick={addPlatform}>新增</button>
      </div>
      <hr/>
      <ul>
        {list.map(item => (
          <li key={item.id}>
            <strong>{item.platformName}</strong> - {item.accountId}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlatformAccounts;
