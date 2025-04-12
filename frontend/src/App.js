import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation
} from 'react-router-dom';

// 保留您原有 pages:
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MembershipPage from './pages/MembershipPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
// ...若您有更多頁面, 請自行 import

// Layout: 用於保留您 header + banner + footer 結構 + handleLogout
function Layout(){
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const location = useLocation();
  const showBanner = (!isLoggedIn && location.pathname === '/');

  const handleLogout = ()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = "/";
  };

  // 您的 style
  const containerStyle = {
    backgroundColor: '#000',
    color: '#ff1c1c',
    minHeight:'100vh',
    margin:0,
    fontFamily:'sans-serif',
    display:'flex',
    flexDirection:'column'
  };
  const headerStyle = {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    padding:'1rem',
    background:'#111',
    borderBottom:'1px solid #f00'
  };
  const navBtnStyle = {
    background:'none',
    border:'2px solid orange',
    borderRadius:'4px',
    color:'orange',
    padding:'6px 12px',
    marginRight:'1rem',
    cursor:'pointer',
    fontWeight:'bold',
    textDecoration:'none'
  };
  const bannerStyle = {
    textAlign:'center',
    padding:'2rem',
    border:'2px solid #f00',
    margin:'1rem',
    borderRadius:'8px',
    background:'rgba(255,28,28,0.06)'
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <button
          onClick={()=> window.location.href='/'}
          style={{...navBtnStyle, marginRight:'2rem'}}
        >
          速誅侵權獵人
        </button>

        <nav style={{ display:'flex', alignItems:'center'}}>
          <Link to="/pricing" style={navBtnStyle}>Pricing</Link>
          <Link to="/contact-us" style={navBtnStyle}>Contact Us</Link>
          {!isLoggedIn && (
            <>
              <Link to="/login" style={navBtnStyle}>Login</Link>
              <Link to="/register" style={navBtnStyle}>Register</Link>
            </>
          )}
          {isLoggedIn && (
            <>
              <Link to="/profile" style={navBtnStyle}>會員中心</Link>
              <Link to="/membership" style={navBtnStyle}>Membership</Link>
              <Link to="/dashboard" style={navBtnStyle}>Dashboard</Link>
              <Link to="/upload" style={navBtnStyle}>Upload</Link>
              <button
                onClick={handleLogout}
                style={{ ...navBtnStyle, border:'none'}}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {showBanner && (
        <div style={bannerStyle}>
          <h1 style={{fontSize:'64px', fontWeight:'bold', margin:'0.5rem 0', color:'orange'}}>
            速誅侵權獵人
          </h1>
          <h2 style={{fontSize:'36px', margin:'0.5rem 0', color:'#ff5500'}}>
            SUZOO!KAIZOKU HUNTER SYSTEM
          </h2>
        </div>
      )}

      <main style={{ flex:1, padding:'1rem', margin:'0 1rem' }}>
        {/* Outlet 用來渲染下層路由 */}
        <Outlet />
      </main>

      <footer style={{ textAlign:'center', padding:'1rem', marginTop:'auto', fontSize:'0.85rem', color:'#fff' }}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br/>
          <span style={{ fontSize:'0.8rem', opacity:0.85 }}>
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}

// App: 設定路由
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* 根路由掛 Layout */}
        <Route path="/" element={<Layout />}>
          {/* index => Home */}
          <Route index element={<Home />} />

          {/* 其他對應頁面 */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact-us" element={<ContactUsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<UploadPage />} />

          {/* 若您有更多, 例如 /infringement */}
          {/* <Route path="infringement" element={<InfringementPage />} /> */}

          {/* 404 => <Route path="*" element={<NotFound/>} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
