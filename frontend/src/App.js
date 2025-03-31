// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import InfringementList from './pages/InfringementList';

// 匯入全域樣式
import './App.css';

function App() {
  return (
    <Router>
      <nav className="top-nav">
        <Link to="/">首頁</Link>
        <Link to="/signup">註冊</Link>
        <Link to="/login">登入</Link>
        <Link to="/dashboard">角色切換</Link>
        <Link to="/upload">上傳</Link>
        <Link to="/infringements">侵權清單</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/infringements" element={<InfringementList />} />
      </Routes>
    </Router>
  );
}

export default App;
