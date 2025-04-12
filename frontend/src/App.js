import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MembershipPage from './pages/MembershipPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';

function Header({ isLoggedIn, onLogout }) {
  return (
    <header>
      <nav>
        <Link to="/" className="brand">速誅侵權獵人</Link>
        <ul>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
          {isLoggedIn ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/membership">Membership</Link></li>
              <li><Link to="/upload">Upload</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><a href="/" onClick={(e) => { e.preventDefault(); onLogout(); }}>Logout</a></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <p>本站獻給我的阿嬤，以紀念她所給予我的愛與教誨。</p>
    </footer>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (tokenValue) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <Header isLoggedIn={!!token} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/dashboard" element={token ? <DashboardPage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/membership" element={token ? <MembershipPage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/upload" element={token ? <UploadPage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={token ? <ProfilePage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
