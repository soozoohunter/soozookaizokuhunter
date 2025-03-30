import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import RoleSelect from './pages/RoleSelect';
import Upload from './pages/Upload';
import InfringementList from './pages/InfringementList';
import './App.css';

function App() {
  return (
    <Router>
      {/* 頂部導覽列 */}
      <nav className="top-nav">
        <Link to="/">首頁</Link>
        <Link to="/signup">註冊</Link>
        <Link to="/login">登入</Link>
        <Link to="/roleSelect">選擇角色</Link>
        <Link to="/upload">上傳</Link>
        <Link to="/infringements">侵權清單</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/roleSelect" element={<RoleSelect />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/infringements" element={<InfringementList />} />
      </Routes>
    </Router>
  );
}

export default App;
