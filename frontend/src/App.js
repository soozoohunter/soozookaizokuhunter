import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';
import UploadPage from './pages/UploadPage';
import BlockchainTest from './pages/BlockchainTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/platform-accounts" element={<PlatformAccounts />} />
        <Route path="/infringements" element={<InfringementList />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/blockchain-test" element={<BlockchainTest />} />
      </Routes>
    </Router>
  );
}

export default App;
