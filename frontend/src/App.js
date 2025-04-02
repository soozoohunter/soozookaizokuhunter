import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <header style={{ padding: '1rem', background: '#eee' }}>
        <Link to="/">Home</Link> | {' '}
        <Link to="/login">登入</Link> | {' '}
        <Link to="/register">註冊</Link> | {' '}
        <Link to="/dashboard">Dashboard</Link> | {' '}
        <Link to="/upload">上傳檔案</Link> | {' '}
        <Link to="/platform-accounts">平台帳號</Link> | {' '}
        <Link to="/infringements">侵權列表</Link> | {' '}
        <Link to="/chain-test">區塊鏈測試</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
