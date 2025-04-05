import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import InfringementList from './pages/InfringementList';
import logo from './logo1.png.heic'; // 引入您的 Logo

function App() {
  return (
    <Router>
      {/* Header 區域，您可以根據需求調整樣式 */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <img src={logo} alt="Logo" style={{ width: '100px', marginRight: '1rem' }} />
        <h1>您的應用程式名稱</h1>
      </header>
      
      {/* 路由區域 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/infringements" element={<InfringementList />} />
      </Routes>
    </Router>
  );
}

export default App;
