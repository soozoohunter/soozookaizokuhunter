import React from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Link, 
  Outlet, 
  useLocation 
} from 'react-router-dom';

// ★如果您有其他 pages：
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';          // 若有
import ContactUsPage from './pages/ContactUsPage'; // 若有
import ProfilePage from './pages/ProfilePage'; // 若有
import MembershipPage from './pages/MembershipPage'; // 若有
import UploadPage from './pages/UploadPage'; // 若有

// Layout 組件：保留您原本的外觀、Banner、Header、Footer
function Layout(){
  // 保留您原本的變數/函式
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

  // 保留您原本的 style
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
      {/* header */}
      <header style={headerStyle}>
        <button
          onClick={()=> window.location.href='/'}
          style={{...navBtnStyle, marginRight:'2rem'}}
        >
          速誅侵權獵人
        </button>

        {/* 導覽列 (保留您原本的 Link) */}
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

      {/* Banner (若在首頁且未登入才顯示) */}
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

      {/* 主內容：Outlet 會渲染子路由對應畫面 */}
      <main style={{ flex:1, padding:'1rem', margin:'0 1rem' }}>
        <Outlet />
      </main>

      {/* Footer */}
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

// App：BrowserRouter + Routes
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* 根路由使用 Layout 包裹 => <Outlet> */}
        <Route path="/" element={<Layout />}>
          {/* index => 直接渲染 Home */}
          <Route index element={<Home />} />

          {/* 您原本的 /login, /register, /dashboard, /upload, /membership, /profile... */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<UploadPage />} /> {/* 若您有 UploadPage */}
          <Route path="membership" element={<MembershipPage />} /> {/* 若您有 */}
          <Route path="profile" element={<ProfilePage />} /> {/* 若您有 */}

          {/* 額外 /pricing, /contact-us */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact-us" element={<ContactUsPage />} />

          {/* 其餘路由 (404等) 可在此加 <Route path="*" element={<NotFound />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
