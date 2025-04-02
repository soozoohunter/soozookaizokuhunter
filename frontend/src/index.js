import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';
import UploadPage from './pages/UploadPage';
import BlockchainTest from './pages/BlockchainTest';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="platform-accounts" element={<PlatformAccounts />} />
        <Route path="infringements" element={<InfringementList />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="chain-test" element={<BlockchainTest />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
